interface PassData {
  userId: string;
  subscriptionType: string;
  line: string;
  grade: string;
  expiresAt: string;
  issuedAt: string;
  signature: string;
}

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z3qX0j+9rKxvK8nQ1Yx
-----END PUBLIC KEY-----`;

export const validatePassSignature = (passData: PassData): boolean => {
  try {
    const dataString = JSON.stringify({
      userId: passData.userId,
      subscriptionType: passData.subscriptionType,
      line: passData.line,
      grade: passData.grade,
      expiresAt: passData.expiresAt,
      issuedAt: passData.issuedAt
    });

    const expectedSignature = simpleHash(dataString + PUBLIC_KEY);

    return passData.signature === expectedSignature;
  } catch (error) {
    console.error('Erreur validation signature:', error);
    return false;
  }
};

const simpleHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const validatePassExpiration = (expiresAt: string): boolean => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  return expiry > now;
};

export const validatePassLine = (passLine: string, vehicleLine: string): boolean => {
  return passLine === vehicleLine || passLine === 'ALL';
};

export const validatePassGrade = (passGrade: string, vehicleGrade: string): boolean => {
  if (passGrade === 'VIP') return true;
  if (passGrade === 'Confort' && vehicleGrade === 'Confort') return true;
  if (passGrade === 'Eco' && vehicleGrade === 'Eco') return true;

  return false;
};

export const generatePassSignature = (passData: Omit<PassData, 'signature'>): string => {
  const dataString = JSON.stringify(passData);
  return simpleHash(dataString + PUBLIC_KEY);
};

export const createSamplePass = (
  userId: string,
  subscriptionType: string,
  line: string,
  grade: string
): PassData => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const passDataWithoutSignature = {
    userId,
    subscriptionType,
    line,
    grade,
    expiresAt: expiresAt.toISOString(),
    issuedAt: now.toISOString()
  };

  const signature = generatePassSignature(passDataWithoutSignature);

  return {
    ...passDataWithoutSignature,
    signature
  };
};
