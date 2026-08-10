import { runTriageSymptom } from "./src/services/triageService.js";

async function main() {
  console.log("--- TEST 1: CRITICAL CHEST PAIN (English) ---");
  const result1 = await runTriageSymptom({
    message: "Severe chest pain and difficulty breathing for the last 30 minutes with sweating",
    language: "English",
    userProfile: { age: 48, gender: "Male", state: "Maharashtra", isBPL: true }
  });
  console.log(JSON.stringify(result1, null, 2));

  console.log("\n--- TEST 2: MILD FEVER & COUGH (Hindi) ---");
  const result2 = await runTriageSymptom({
    message: "मुझे 2 दिन से हल्का बुखार और खांसी है, थोड़ा बदन दर्द भी है",
    language: "Hindi",
    userProfile: { age: 32, gender: "Female", state: "Uttar Pradesh", isBPL: true }
  });
  console.log(JSON.stringify(result2, null, 2));
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
