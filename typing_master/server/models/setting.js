const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true, default: "site_config" },
    siteName: { type: String, default: "Typing Master" },
    logoUrl: { type: String, default: "/icon.svg" },
    defaultTheme: { type: String, default: "monkeytype" },
    maintenanceMode: { type: Boolean, default: false },
    languages: {
      type: [
        {
          code: { type: String, required: true },
          name: { type: String, required: true },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: [
        { code: "english", name: "English", enabled: true },
        { code: "bangla", name: "বাংলা (Bangla)", enabled: true },
      ],
    },
    layouts: {
      type: [
        {
          code: { type: String, required: true },
          name: { type: String, required: true },
          language: { type: String, default: "english" },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: [
        { code: "qwerty", name: "QWERTY Standard", language: "english", enabled: true },
        { code: "avro", name: "Avro Phonetic", language: "bangla", enabled: true },
        { code: "bijoy", name: "Bijoy Layout", language: "bangla", enabled: true },
      ],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Setting", settingSchema);
