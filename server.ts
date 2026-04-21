import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase for server-side persistence of OTPs
const firebaseApp = initializeApp(firebaseConfig);
// @ts-ignore
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Nodemailer Configuration (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // Explicitly using the credentials you provided to resolve the 535 login error
    user: 'onahpromiseaka@gmail.com',
    pass: 'ykvrjlpxkpjagomi', 
  },
});

// Verify SMTP connection on startup with detailed logging
transporter.verify((error, success) => {
  console.log(`[SMTP-INIT] Verification Start...`);
  console.log(`[SMTP-INIT] Using Account: onahpromiseaka@gmail.com`);
  
  if (error) {
    console.error(`[SMTP-AUTH-ERROR] Status: FAILED`);
    console.error(`[SMTP-AUTH-ERROR] Message: ${error.message}`);
  } else {
    console.log("[SMTP-SUCCESS] Status: VERIFIED. Emails are ready to send.");
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Send OTP via Nodemailer
  app.post("/api/auth/send-otp", async (req, res) => {
    let { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    email = email.toLowerCase().trim();

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 300000; // 5 mins (updated to 5 as requested)

    console.log(`[OTP-GENERATE] Target: ${email}, Code: ${code}, TTL: 5m`);

    try {
      // Store in Firestore for security and persistence
      await setDoc(doc(db, "otps", email), { 
        code, 
        expires,
        email,
        createdAt: Date.now()
      });
      console.log(`[FIRESTORE-SAVE] OTP doc created for ${email}`);

      const currentUser = 'onahpromiseaka@gmail.com';
      const currentPass = 'ykvrjlpxkpjagomi';

      if (currentUser && currentPass) {
        const mailOptions = {
          from: `"CRE Connect" <${currentUser}>`,
          to: email,
          subject: "Your CRE Connect Verification Code",
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #111; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
              <h1 style="font-size: 24px; font-weight: bold; font-style: italic; color: #000;">CRE CONNECT</h1>
              <p style="font-size: 16px;">Hello,</p>
              <p style="font-size: 16px;">Thank you for registering. Use the following One-Time Password (OTP) to verify your account:</p>
              <div style="font-size: 36px; font-weight: 900; letter-spacing: 6px; padding: 24px; background: #f9f9f9; border-radius: 16px; text-align: center; margin: 20px 0;">
                ${code}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
                This code will expire in 10 minutes.<br/>
                If you didn't request this, please ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">© 2024 CRE Connect Tech Community</p>
            </div>
          `
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log(`[SMTP-SUCCESS] Email sent to ${email}: ${info.response}`);
          res.json({ message: "OTP sent successfully. Please check your inbox (and spam folder)." });
        } catch (sendError: any) {
          console.error(`[SMTP-ERROR] Failed to send email to ${email}:`, sendError);
          
          if (sendError.message.includes('535-5.7.8')) {
            const errorMsg = "CRITICAL: Gmail authentication failed. Your App Password or Email is incorrect. Check server logs for fix instructions.";
            console.error(`[SMTP-AUTH-FAILURE] User: ${process.env.EMAIL_USER}, Pass Provided: ${!!process.env.EMAIL_PASS}`);
            console.error(">>> FIX: Your Gmail credentials were rejected. You MUST use a 'Gmail App Password', not your regular login password. Generate one at: https://myaccount.google.com/apppasswords");
            return res.status(401).json({ error: errorMsg });
          }
          
          res.status(500).json({ error: "Email delivery failed. Please try again later." });
        }
      } else {
        console.warn("[SMTP-WARN] EMAIL_USER or EMAIL_PASS missing. Using Dev Mode Mocking.");
        res.json({ 
          message: "Email service not configured. OTP sent to server log.", 
          debug_otp: code 
        });
      }
    } catch (err: any) {
      console.error(`[OTP-ERROR] Internal failure for ${email}:`, err);
      res.status(500).json({ error: "Failed to process OTP request" });
    }
  });

  // API Route: Verify OTP
  app.post("/api/auth/verify-otp", async (req, res) => {
    let { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: "Email and OTP code are required" });
    }

    email = email.toLowerCase().trim();
    code = code.trim();

    console.log(`[OTP-VERIFY-START] Email: ${email}, InputCode: ${code}`);
    
    try {
      const otpDoc = await getDoc(doc(db, "otps", email));
      
      if (!otpDoc.exists()) {
        console.warn(`[OTP-VERIFY-FAIL] No document found for ${email} in 'otps' collection`);
        
        // Debug: List all available OTPs to find potential ID mismatches
        try {
          const allDocs = await getDocs(collection(db, "otps"));
          console.log(`[OTP-DEBUG] Total documents in 'otps': ${allDocs.size}`);
          allDocs.forEach(d => {
            console.log(`  - DocID: "${d.id}" (Type: ${typeof d.id}, Length: ${d.id.length})`);
          });
        } catch (listErr) {
          console.error(`[OTP-DEBUG-ERR] Failed to list docs:`, listErr);
        }

        return res.status(400).json({ error: "No OTP found for this email. Please request a new one." });
      }

      const { code: savedCode, expires } = otpDoc.data();
      const now = Date.now();

      console.log(`[OTP-VERIFY-CHECK] StoredCode: ${savedCode}, Expires: ${new Date(expires).toLocaleTimeString()}, Now: ${new Date(now).toLocaleTimeString()}`);

      if (now > expires) {
        console.warn(`[OTP-VERIFY-FAIL] OTP expired for ${email}`);
        await deleteDoc(doc(db, "otps", email));
        return res.status(400).json({ error: "OTP has expired. Please request a new one." });
      }

      if (savedCode !== code) {
        console.warn(`[OTP-VERIFY-FAIL] Code mismatch for ${email}. User entered: ${code}, Expected: ${savedCode}`);
        return res.status(400).json({ error: "Invalid OTP code" });
      }

      // Success
      console.log(`[OTP-VERIFY-SUCCESS] ${email} verified successfully.`);
      
      // Cleanup
      await deleteDoc(doc(db, "otps", email));
      res.json({ success: true, message: "OTP verified" });
    } catch (err: any) {
      console.error(`[OTP-VERIFY-ERROR] Internal failure for ${email}:`, err);
      res.status(500).json({ error: "Verification failed due to server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
