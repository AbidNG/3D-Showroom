import { randomBytes } from 'node:crypto';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const bytes = randomBytes(20);
let buffer = 0;
let bits = 0;
let secret = '';
for (const byte of bytes) {
  buffer = (buffer << 8) | byte;
  bits += 8;
  while (bits >= 5) {
    secret += alphabet[(buffer >>> (bits - 5)) & 31];
    bits -= 5;
  }
  buffer &= (1 << bits) - 1;
}
if (bits > 0) secret += alphabet[(buffer << (5 - bits)) & 31];

console.log('Set this secret as ADMIN_TOTP_SECRET in your private environment configuration:');
console.log(secret);
console.log('\nAdd a time-based one-time password entry to your authenticator app with:');
console.log(`otpauth://totp/AURA%20Showroom%20Admin?secret=${secret}&issuer=AURA%20Showroom&algorithm=SHA1&digits=6&period=30`);
console.log('\nKeep the secret private. Do not commit it or paste it into chat.');
