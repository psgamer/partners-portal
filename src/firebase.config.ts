const firebaseStagingConfig: Readonly<FirebaseConfig> = {
  apiKey: "AIzaSyBBnvVGyBRBrXZTY1a3aYqXT9A0-dpfM0A",
  authDomain: "eset-partners-portal-staging.firebaseapp.com",
  projectId: "eset-partners-portal-staging",
  storageBucket: "eset-partners-portal-staging.appspot.com",
  messagingSenderId: "941710386974",
  appId: "1:941710386974:web:748b8358b211cd35640b0f"
}
const firebaseProdConfig: Readonly<FirebaseConfig> = {
  apiKey: "AIzaSyAvlbJIfjJLZqXOMkostetXBnW60Sa-B1o",
  authDomain: "eset-partners-portal-prod.firebaseapp.com",
  projectId: "eset-partners-portal-prod",
  storageBucket: "eset-partners-portal-prod.appspot.com",
  messagingSenderId: "948996288204",
  appId: "1:948996288204:web:927c4bf7a004451bd15c69"
}

interface Config {
  apiKey: string,
  authDomain: string,
  projectId: string,
  storageBucket: string,
  messagingSenderId: string,
  appId: string
}

export type FirebaseConfig = Readonly<Config>;
export {firebaseStagingConfig, firebaseProdConfig};
