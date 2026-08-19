import crypto from "crypto";

const timingSafeCompare = (expected, actual) => {
  if (!expected || !actual) return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

export const verifyRazorpayWebhook = (rawBody, signature, secret = process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET) => {
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return timingSafeCompare(expected, signature);
};

export const razorpayConfigured = () =>
  Boolean(
    (process.env.RAZORPAY_PLATFORM_KEY_ID || process.env.RAZORPAY_KEY_ID) &&
    (process.env.RAZORPAY_PLATFORM_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET)
  );

export const verifyPayUHash = ({ body, salt }) => {
  if (!salt || !body?.hash) return false;
  const status = body.status || "";
  const udf5 = body.udf5 || "";
  const udf4 = body.udf4 || "";
  const udf3 = body.udf3 || "";
  const udf2 = body.udf2 || "";
  const udf1 = body.udf1 || "";
  const email = body.email || "";
  const firstname = body.firstname || "";
  const productinfo = body.productinfo || "";
  const amount = body.amount || "";
  const txnid = body.txnid || "";
  const key = body.key || "";
  const reverseHashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const expected = crypto.createHash("sha512").update(reverseHashString).digest("hex");
  return timingSafeCompare(expected, body.hash);
};

export const verifyGenericWebhookHmac = ({ rawBody, signature, secret }) => {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeCompare(expected, signature);
};
