import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.config import settings

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", settings.SMTP_USER if hasattr(settings, "SMTP_USER") else "ee247900@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", settings.SMTP_PASSWORD if hasattr(settings, "SMTP_PASSWORD") else "")
SENDER_NAME = "Secure QP System Auth"

import socket
import ssl

def send_smtp_email(to_email: str, subject: str, html_content: str, text_content: str = None) -> dict:
    """
    Directly send email via Gmail / custom SMTP with IPv4 enforcement & fallback.
    Returns dict with status, success boolean, and detailed diagnostics.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", settings.SMTP_USER if hasattr(settings, "SMTP_USER") else "ee247900@gmail.com")
    smtp_password = os.getenv("SMTP_PASSWORD", settings.SMTP_PASSWORD if hasattr(settings, "SMTP_PASSWORD") else "")

    if not smtp_password:
        logger.warning("SMTP_PASSWORD is not configured in backend environment or config.py.")
        return {
            "success": False,
            "error": "SMTP_PASSWORD not configured. Please set SMTP_PASSWORD in backend/.env with your 16-character Google App Password.",
            "smtp_user": smtp_user
        }

    clean_password = smtp_password.replace(" ", "").strip()

    # Enforce IPv4 DNS resolution for Windows compatibility
    old_getaddrinfo = socket.getaddrinfo
    def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
        return old_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SENDER_NAME} <{smtp_user}>"
        msg["To"] = to_email

        if text_content:
            part1 = MIMEText(text_content, "plain")
            msg.attach(part1)

        part2 = MIMEText(html_content, "html")
        msg.attach(part2)

        # Apply IPv4 patch
        socket.getaddrinfo = getaddrinfo_ipv4

        # Connect via TLS (port 587) or SSL (port 465)
        try:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            server.ehlo()
            context = ssl.create_default_context()
            server.starttls(context=context)
            server.ehlo()
            server.login(smtp_user, clean_password)
            server.sendmail(smtp_user, [to_email], msg.as_string())
            server.quit()
        except smtplib.SMTPAuthenticationError:
            raise
        except Exception as primary_err:
            # Fallback to SSL (port 465)
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(smtp_host, 465, context=context, timeout=15)
            server.login(smtp_user, clean_password)
            server.sendmail(smtp_user, [to_email], msg.as_string())
            server.quit()

        logger.info(f"Email successfully sent to {to_email} via SMTP [{smtp_user}]")
        return {
            "success": True,
            "message": f"Email successfully dispatched to {to_email}",
            "smtp_user": smtp_user
        }
    except (smtplib.SMTPAuthenticationError, smtplib.SMTPServerDisconnected) as e:
        err_msg = f"Gmail SMTP Authentication Failed or connection reset (535 Bad Credentials). Ensure 2-Step Verification is enabled on '{smtp_user}' and generate a fresh 16-character App Password at https://myaccount.google.com/apppasswords"
        logger.error(f"{err_msg} Details: {e}")
        return {"success": False, "error": err_msg, "detail": str(e)}
    except Exception as e:
        err_msg = f"SMTP Transmission Error: {str(e)}"
        logger.error(err_msg)
        return {"success": False, "error": err_msg, "detail": str(e)}
    finally:
        socket.getaddrinfo = old_getaddrinfo

def send_otp_email(to_email: str, otp_code: str) -> dict:
    """Send 6-digit MFA OTP code email."""
    subject = f"🔐 Your Security OTP Code: {otp_code} - Secure QP System"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0E1A; color: #F9FAFB; padding: 20px; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; }}
            .header {{ text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 24px; }}
            .logo {{ font-size: 24px; font-weight: bold; color: #F59E0B; }}
            .otp-box {{ background: rgba(245, 158, 11, 0.1); border: 2px dashed #F59E0B; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }}
            .otp-code {{ font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #F59E0B; margin: 0; }}
            .footer {{ text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }}
            .warning {{ font-size: 13px; color: #EF4444; margin-top: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔒 SECURE QUESTION PAPER SYSTEM</div>
                <p style="color: #9CA3AF; font-size: 14px; margin-top: 4px;">Two-Factor Authentication Security Gateway</p>
            </div>
            <p>Hello,</p>
            <p>You have requested authentication access to the <strong>Secure Question Paper Network</strong>. Use the 6-digit One-Time Password (OTP) below to complete your login:</p>
            
            <div class="otp-box">
                <div class="otp-code">{otp_code}</div>
                <div style="font-size: 12px; color: #9CA3AF; margin-top: 8px;">Valid for 10 minutes</div>
            </div>

            <p class="warning">⚠️ Never share this security OTP code with anyone. System administrators will never ask for your code.</p>
            
            <div class="footer">
                <p>Secure Cloud-Based Question Paper Management Platform</p>
                <p>© 2026 Secure QP System. Zero-Trust Cryptographic Release.</p>
            </div>
        </div>
    </body>
    </html>
    """
    text = f"Your Secure QP System OTP Code is: {otp_code}. Valid for 10 minutes. Do not share this code with anyone."
    return send_smtp_email(to_email, subject, html, text)

def send_access_request_email(admin_email: str, requester_email: str, reason: str) -> dict:
    """Send access request notification to network admin email."""
    subject = f"📩 New Access Request from {requester_email} - Secure QP Network"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0E1A; color: #F9FAFB; padding: 20px; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; }}
            .header {{ text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 24px; }}
            .logo {{ font-size: 22px; font-weight: bold; color: #3B82F6; }}
            .info-box {{ background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0; }}
            .footer {{ text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📩 Member Access Request</div>
                <p style="color: #9CA3AF; font-size: 14px; margin-top: 4px;">Network Admin Review Required</p>
            </div>
            <p>Hello Admin,</p>
            <p>A new member is requesting access to your Secure Question Paper Network:</p>
            
            <div class="info-box">
                <p><strong>Applicant Email:</strong> {requester_email}</p>
                <p><strong>Reason for Joining:</strong></p>
                <p style="font-style: italic; color: #E5E7EB; margin-left: 8px;">"{reason}"</p>
            </div>

            <p>You can review and approve this request from your <strong>Admin Dashboard -> Access Requests</strong> panel.</p>
            
            <div class="footer">
                <p>Secure Cloud-Based Question Paper Management Platform</p>
            </div>
        </div>
    </body>
    </html>
    """
    text = f"New Access Request: {requester_email} is requesting access to your network. Reason: {reason}"
    return send_smtp_email(admin_email, subject, html, text)

def send_invitation_email(member_email: str, network_name: str, join_link: str) -> dict:
    """Send network invitation email with join link."""
    subject = f"🎉 You're Invited to Join Network '{network_name}' - Secure QP System"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0E1A; color: #F9FAFB; padding: 20px; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; }}
            .header {{ text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 24px; }}
            .logo {{ font-size: 22px; font-weight: bold; color: #10B981; }}
            .btn {{ display: inline-block; background-color: #F59E0B; color: #0A0E1A; font-weight: bold; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }}
            .footer {{ text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎉 Network Invitation</div>
                <p style="color: #9CA3AF; font-size: 14px; margin-top: 4px;">Secure Question Paper Management System</p>
            </div>
            <p>Hello,</p>
            <p>You have been invited to join the <strong>{network_name}</strong> question paper network.</p>
            
            <div style="text-align: center;">
                <a href="{join_link}" class="btn">🚀 Join Network Now</a>
            </div>

            <p style="font-size: 13px; color: #9CA3AF;">Or copy and paste this link into your browser:<br/><span style="color: #60A5FA; word-break: break-all;">{join_link}</span></p>

            <div class="footer">
                <p>Secure Cloud-Based Question Paper Management Platform</p>
            </div>
        </div>
    </body>
    </html>
    """
    text = f"You are invited to join {network_name}. Join link: {join_link}"
    return send_smtp_email(member_email, subject, html, text)

def send_access_otp_email(admin_email: str, requester_email: str, otp_code: str, reason: str = "") -> dict:
    """Send access-grant OTP to admin when a question maker requests network access."""
    subject = f"🔑 Access OTP for {requester_email} - Secure QP Network"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0E1A; color: #F9FAFB; padding: 20px; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; }}
            .header {{ text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 24px; }}
            .logo {{ font-size: 22px; font-weight: bold; color: #F59E0B; }}
            .info-box {{ background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0; }}
            .otp-box {{ background: rgba(245, 158, 11, 0.1); border: 2px dashed #F59E0B; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }}
            .otp-code {{ font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #F59E0B; margin: 0; }}
            .footer {{ text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }}
            .warning {{ font-size: 13px; color: #EF4444; margin-top: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔑 Network Access OTP</div>
                <p style="color: #9CA3AF; font-size: 14px; margin-top: 4px;">Question Maker Access Verification</p>
            </div>
            <p>Hello Admin,</p>
            <p>A Question Maker is requesting access to your Secure Question Paper Network. Share the OTP below with them <strong>only if you approve</strong> their access:</p>
            
            <div class="info-box">
                <p><strong>Requester Email:</strong> {requester_email}</p>
                {"<p><strong>Reason:</strong> <em>" + reason + "</em></p>" if reason else ""}
            </div>

            <div class="otp-box">
                <div style="font-size: 12px; color: #9CA3AF; margin-bottom: 8px;">ACCESS GRANT OTP CODE</div>
                <div class="otp-code">{otp_code}</div>
                <div style="font-size: 12px; color: #9CA3AF; margin-top: 8px;">Valid for 10 minutes · Share with requester to grant access</div>
            </div>

            <p>The requester is waiting on the login page to enter this OTP. <strong>Only share this code if you trust and approve this person.</strong></p>
            <p class="warning">⚠️ If you did not expect this request, do NOT share this code.</p>
            
            <div class="footer">
                <p>Secure Cloud-Based Question Paper Management Platform</p>
                <p>© 2026 Secure QP System. Two-Party Access Verification.</p>
            </div>
        </div>
    </body>
    </html>
    """
    text = f"Access OTP for {requester_email}: {otp_code}. Share this code with the requester ONLY if you approve their access to the network."
    return send_smtp_email(admin_email, subject, html, text)
