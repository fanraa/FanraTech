import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, code, name, type = 'signup' } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and OTP code are required.' },
        { status: 400 }
      );
    }

    const { EMAIL_USER, EMAIL_PASS } = process.env;
    
    let subject = `[KODE OTP: ${code}] Verifikasi Pendaftaran Akun FanraTech`;
    let messageBody = `Halo ${name || 'Mitra FanraTech'},\n\nTerima kasih telah bergabung bersama kami. Kami berkomitmen untuk mendampingi perjalanan kreatif Anda melalui platform kustomisasi visual berkualitas tinggi.\n\nUntuk menyelesaikan verifikasi pembuatan akun baru Anda di FanraTech, silakan salin dan masukkan kode verifikasi (OTP) berikut pada halaman pendaftaran:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n     [ ${code} ]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n*Catatan: Demi mengamankan privasi akun Anda, mohon untuk tidak meneruskan atau memberikan kode OTP ini kepada siapapun. Tim FanraTech tidak akan pernah meminta kata sandi atau kode verifikasi Anda.*\n\nJika Anda tidak merasa berniat mendaftarkan akun baru, Anda dapat mengabaikan email keamanan ini dengan aman.\n\nKami sangat antusias menyambut kolaborasi hebat yang akan kita ciptakan bersama!\n\nSalam Hangat,\nLayanan Autentikasi Finansial & Kreatif\nFanraTech Indonesia`;

    if (type === 'reset') {
      subject = `[KODE OTP RESET: ${code}] Atur Ulang Kata Sandi Akun FanraTech`;
      messageBody = `Halo ${name || 'Mitra FanraTech'},\n\nKami menerima permintaan pengaturan ulang kata sandi untuk akun Anda yang terdaftar pada platform kreatif FanraTech.\n\nUntuk menyatakan keaslian identitas Anda sebagai pemilik hak akses, silakan masukkan kode verifikasi (OTP) pemulihan berikut di bawah ini:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n     [ ${code} ]\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nMasukkan pula kata sandi baru pilihan Anda agar dapat segera masuk kembali untuk melayani serta mengelola portofolio visual Anda.\n\n*Catatan: Demi mengamankan privasi akun Anda, mohon untuk tidak meneruskan atau memberikan kode OTP ini kepada siapapun dan simpan kata sandi baru Anda sebaik-baiknya.*\n\nSalam Hangat,\nLayanan Autentikasi Finansial & Kreatif\nFanraTech Indonesia`;
    }

    // Use Web3Forms fallback if SMTP isn't configured, so the code won't immediately break in the preview
    // but the email will still only go to the developer.
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn("SMTP variables EMAIL_USER and EMAIL_PASS are missing. Calling Web3Forms as a fallback.");
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: "5ef9c60b-807b-4b32-acdb-959c433b4196",
          name: "Sistem Keamanan FanraTech (Fallback)",
          email: email,
          from_name: "FanraTech OTP",
          subject: subject,
          message: `Halo,\n\nEmail ini harusnya dikirim ke pengguna Anda: ${email}.\nNamun karena Anda belum mengatur EMAIL_USER dan EMAIL_PASS di .env, email ini dialihkan kepada Anda melalui Web3Forms.\n\nKode OTP Pengguna: ${code}`,
          replyto: email
        })
      });
      
      const resData = await response.json();
      return NextResponse.json({ 
        success: true, 
        message: 'Sent via fallback to Developer Email.', 
        data: resData 
      });
    }

    // Modern nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to any SMTP provider
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    // Send strictly to the user (cleanEmail)
    const mailOptions = {
      from: `"Tim FanraTech" <${EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: messageBody,
    };

    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ success: true, message: 'Email sent successfully via SMTP' });
  } catch (error: any) {
    console.error("Error sending OTP via SMTP:", error);
    return NextResponse.json(
      { error: 'Failed to send verification code.', details: error.message },
      { status: 500 }
    );
  }
}
