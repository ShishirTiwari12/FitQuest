// utils/esewa.js
const crypto = require("crypto");

const ESEWA_SECRET_KEY = "8gBm/:&EnhH.1/q"; // UAT - Fixed: added closing parenthesis
const ESEWA_PRODUCT_CODE = "EPAYTEST";

function generateEsewaSignature(
  total_amount,
  transaction_uuid,
  product_code = ESEWA_PRODUCT_CODE,
) {
  // signed_field_names = total_amount,transaction_uuid,product_code
  // eSewa wants: "value1,value2,value3" in that order
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

  const hmac = crypto.createHmac("sha256", ESEWA_SECRET_KEY);
  hmac.update(data);
  return hmac.digest("base64");
}

function verifyEsewaSignature(
  transaction_code,
  status,
  total_amount,
  transaction_uuid,
  product_code,
  signed_field_names,
  receivedSignature,
) {
  // Reconstruct the data string from signed_field_names
  const fieldValues = signed_field_names.split(",").map((field) => {
    const fieldMap = {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
    };
    return `${field}=${fieldMap[field]}`;
  });

  const data = fieldValues.join(",");
  const hmac = crypto.createHmac("sha256", ESEWA_SECRET_KEY);
  hmac.update(data);
  const calculatedSignature = hmac.digest("base64");

  return calculatedSignature === receivedSignature;
}

module.exports = {
  generateEsewaSignature,
  verifyEsewaSignature,
  ESEWA_PRODUCT_CODE,
  ESEWA_SECRET_KEY,
};
