import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";

const METADATA_DIR = "./metadata";
const IMAGE_CID = process.env.VITE_NFT_CID;

if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR);
}

for (let i = 1; i <= 10; i++) {
  const metadata = {
    name: `NFT #${i - 1}`,
    description: "NFT con imagen alojada en IPFS (formato webp)",
    image: `ipfs://${IMAGE_CID}/${i}.webp`,
  };

  fs.writeFileSync(
    path.join(METADATA_DIR, `${i}.json`),
    JSON.stringify(metadata, null, 2)
  );
}

console.log("✅ Metadata generada en ./metadata/");
