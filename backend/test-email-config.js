require("dotenv").config();
const {
  sendPasswordResetEmail,
  sendTestEmail,
} = require("./services/emailService");

const testEmailConfiguration = async () => {
  console.log("═══════════════════════════════════════════════════════");
  console.log("📧 EMAIL CONFIGURATION TEST");
  console.log("═══════════════════════════════════════════════════════\n");

  // Check environment variables
  console.log("1️⃣  Checking Environment Variables...\n");

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM;
  const frontendUrl = process.env.FRONTEND_URL;

  console.log(
    "   EMAIL_SERVICE:",
    process.env.EMAIL_SERVICE || "gmail (default)"
  );
  console.log(
    "   EMAIL_HOST:",
    process.env.EMAIL_HOST || "smtp.gmail.com (default)"
  );
  console.log("   EMAIL_PORT:", process.env.EMAIL_PORT || "587 (default)");
  console.log("   EMAIL_USER:", emailUser || "❌ NOT SET");
  console.log(
    "   EMAIL_PASS:",
    emailPass ? `✅ Set (${emailPass.length} chars)` : "❌ NOT SET"
  );
  console.log("   EMAIL_FROM:", emailFrom || '"Group 10 Project" (default)');
  console.log(
    "   FRONTEND_URL:",
    frontendUrl || "http://localhost:3000 (default)"
  );
  console.log("");

  if (!emailUser || !emailPass) {
    console.error("❌ MISSING CREDENTIALS");
    console.error("   Please set EMAIL_USER and EMAIL_PASS in .env file");
    console.error("   See GMAIL_SETUP_GUIDE.md for instructions\n");
    process.exit(1);
  }

  console.log("✅ Configuration looks good!\n");

  // Test 1: Simple test email
  console.log("2️⃣  Sending Test Email...\n");

  try {
    await sendTestEmail(emailUser);
    console.log("✅ Test email sent successfully!");
    console.log(`   Check inbox: ${emailUser}\n`);
  } catch (error) {
    console.error("❌ Test email failed:", error.message);
    console.error("   Error details:", error);
    console.error("\n💡 Troubleshooting:");
    console.error(
      "   - Make sure you are using App Password, not Gmail password"
    );
    console.error("   - Enable 2-Step Verification in Gmail");
    console.error("   - Check EMAIL_USER and EMAIL_PASS are correct");
    console.error("   - See GMAIL_SETUP_GUIDE.md for detailed instructions\n");
    process.exit(1);
  }

  // Test 2: Password reset email with sample token
  console.log("3️⃣  Sending Password Reset Email (Sample)...\n");

  const sampleToken =
    "test-reset-token-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substr(2, 9);

  try {
    await sendPasswordResetEmail(emailUser, sampleToken, "Test User");
    console.log("✅ Password reset email sent successfully!");
    console.log(`   Check inbox: ${emailUser}`);
    console.log(`   Sample token: ${sampleToken}\n`);
  } catch (error) {
    console.error("❌ Password reset email failed:", error.message);
    console.error("   Error details:", error, "\n");
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("🎉 ALL TESTS PASSED!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n📬 Next Steps:");
  console.log("   1. Check your inbox:", emailUser);
  console.log("   2. You should receive 2 emails:");
  console.log("      - Test Email");
  console.log("      - Password Reset Email");
  console.log("   3. If emails are not in inbox, check Spam/Junk folder");
  console.log("   4. Click the reset link in the password reset email");
  console.log("   5. Test the complete forgot password flow in the app\n");

  console.log("🚀 Email service is ready for production!");
  console.log("");
};

// Run the test
testEmailConfiguration().catch((error) => {
  console.error("\n💥 Unexpected error:", error);
  process.exit(1);
});
