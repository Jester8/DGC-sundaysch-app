
import dotenv from "dotenv";
import mongoose from "mongoose";
import Manual from "../models/Manual.js";

dotenv.config();

const manualsData = [
  // JANUARY 2026
  {
    id: "jan_2026_01",
    title: "JESUS AS THE DOOR OF THE SHEEP",
    theme: "JESUS, THE GREAT SHEPHERD",
    week: 1,
    date: "January 4, 2026",
    imageUrl: "http://192.168.56.2:5000/public/images/january/king.png",
    memoryVerse: "I am the door: by me if any man enter in, he shall be saved and shall go in and out, and find pasture. (John 10:9)",
    text: "John 10:1-16, Psalm 23:1-6",
    introduction: "Unlike the earthly work of a shepherd that begins when there is a sheepfold, Jesus' shepherding exists even before the sheepfold. He is the Shepherd of the means by which we become part of the sheepfold; He is the very door to the sheepfold. He doesn't just take care of the sheep alone; He brings the sheep in.",
    mainPoints: [
      {
        title: "Jesus is the only way to the father",
        description: "Jesus is only way to God, and every other portal or means is a lie. We can go to God through Jesus alone.",
        references: ["John 14:6", "Ephesians 2:18", "Hebrews 7:25", "1 Tim 2:5", "John 3:16-18"]
      },
      {
        title: "Jesus is the only way to experience salvation",
        description: "The only way to be saved is by believing in Jesus and His finished work.",
        references: ["Acts 4:12", "John 10:7-9", "John 8:24", "Romans 5:1-2"]
      },
      {
        title: "Jesus is the only way to eternal life",
        description: "The sheep are inheritors of eternal life, so to experience it, one must belong to the sheepfold. The only way to belong to the sheepfold is by believing in Jesus.",
        references: ["1 John 5:11-12", "Romans 6:23", "John 3:16&36", "John 6:40", "John 5:24"]
      },
      {
        title: "Jesus is the only way by which anyone can go out of the sheepfold",
        description: "The sheepfold belongs to Jesus, and He decides what happens to His sheep. One of His decisions is that the sheep remain with Him forever.",
        references: ["John 10:27-28"]
      }
    ],
    classDiscussion: "If Jesus is the door to the sheepfold, can a man come out from the sheepfold without His permission? Will Jesus permit a man to leave the sheepfold, especially considering that He intends to bring in even those who are out (John 10:16)?",
    conclusion: "Our faith is anchored on a Shepherd who doesn't just tend to us. Our Shepherd also makes us His sheep. It is our association to the Shepherd that makes us a part of the sheepfold. It is a universal and everlasting truth – no one goes in or out of the sheepfold unless Jesus has allowed him. We are implicated because we have entered in by the Door.",
    month: "January",
    order: 1
  },
  {
    id: "jan_2026_02",
    title: "The Cost of our Salvation",
    theme: "Jesus, The Great Shepherd",
    week: 2,
    date: "January 11, 2026",
    memoryVerse: "I am the good shepherd: the good shepherd giveth his life for the sheep. (John 10:11 KJV)",
    text: "John 10:11-18",
    introduction: "At the very core of our salvation is the ultimate price Jesus paid to save mankind. Jesus Christ as the Great Shepherd, is evident in how His shepherding over us began not in comfort but by laying down His life on the Cross. Through this act of devotion, He established an eternal ownership and an unbreakable security for all who are called by His Name.",
    mainPoints: [
      {
        title: "He Fulfilled Prophecy",
        description: "By sacrificing His life and dying on the Cross",
        references: ["Eze 34:23-24", "Isa 40:11", "Micah 5:4-5", "John 10:11,15"]
      },
      {
        title: "The Promise of Redemption and Salvation",
        description: "Through His death, our sins were forgiven, our souls restored and by faith, we were saved",
        references: ["1 Peter 2:25", "Rev 5:9"]
      },
      {
        title: "He Provides All We Ever Need",
        description: "Loving us unconditionally",
        references: ["Ps 23:1-3", "John 10:9", "Ps 23:4-6"]
      },
      {
        title: "Assurance of Eternal Life",
        description: "We have assurance of eternal life in God through Jesus Christ",
        references: ["John 10:28-30", "Titus 1:2", "Rom 5:21"]
      },
      {
        title: "Our Identity as Sons",
        description: "Our identity as sons is formed in Him",
        references: ["John 10:3-5", "John 1:12-13", "Rom 8:14", "1 John 3:1"]
      }
    ],
    classDiscussion: "The sheep know the Shepherd's voice (John 10:4). In what practical ways can you distinguish the voice of the Great Shepherd from the noise of the world?",
    conclusion: "The sacrifice of Jesus has widely opened us to His unconditional love, protection, salvation and eternal life. Understanding this makes us appreciate and make good use of our inheritance and identity in Christ.",
    month: "January",
    order: 2
  },
  {
    id: "jan_2026_03",
    title: "The Shepherd Who Cares",
    theme: "Jesus the Great Shepherd",
    week: 3,
    date: "January 18, 2026",
    memoryVerse: "I am the good shepherd: the good shepherd giveth his life for the sheep. (John 10:11 KJV)",
    text: "John 10:11–18",
    introduction: "In Scripture, Jesus is revealed as the Great Shepherd who loves, guides, and protects His sheep. A shepherd's duty is to lead and care for his flock, even at the cost of his own life. Unlike a hireling who runs away when danger comes, Jesus laid down His life for us. To know Him as our Shepherd is to walk in trust, peace, and total dependence on His voice.",
    mainPoints: [
      {
        title: "He Knows His Sheep",
        description: "Jesus has a personal relationship with His sheep. He knows each one by name and understands their needs.",
        references: ["John 10:14", "Psalm 139:1–3", "2 Timothy 2:19"]
      },
      {
        title: "He Leads His Sheep",
        description: "The Great Shepherd goes before His flock, showing them the right path and guiding them into truth.",
        references: ["Psalm 23:1–3", "Isaiah 48:17", "John 16:13"]
      },
      {
        title: "He Protects from Danger",
        description: "Jesus stands as a shield for His sheep. He watches over them and delivers them from the enemy's snare.",
        references: ["John 10:27–28", "Psalm 91:1–4", "Zechariah 2:5"]
      },
      {
        title: "He Provides for His Sheep",
        description: "The Great Shepherd ensures that His sheep do not lack. He satisfies both physical and spiritual needs.",
        references: ["Psalm 23:1–2", "Philippians 4:19", "Matthew 6:33"]
      },
      {
        title: "He Laid Down His Life",
        description: "Out of love, Jesus gave His life for the salvation of His sheep. His sacrifice is the ultimate proof of His care.",
        references: ["John 10:15", "Isaiah 53:6", "Hebrews 13:20–21"]
      }
    ],
    classDiscussion: "What makes Jesus different from other shepherds or leaders? How can we train our hearts to recognize and follow His voice daily?",
    conclusion: "Jesus, the Great Shepherd, never leaves His flock unattended. He knows us, leads us, provides for us, and protects us. As His sheep, we must remain close to Him, listening and obeying His voice. The safest and most peaceful place to be is under the care of the Shepherd.",
    month: "January",
    order: 3
  }
  // Add more months here following the same structure
];

const createManuals = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Check if manuals already exist
    const existingCount = await Manual.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing manuals`);
      console.log("Options:");
      console.log("1. Clear all and re-seed");
      console.log("2. Add new manuals (may create duplicates)");
      console.log("\nTo proceed with clearing, edit the script to set: clearExisting = true");
      
      // Uncomment the line below to clear and re-seed
      // await Manual.deleteMany({});
      // console.log("🗑️  Cleared existing manuals");
    } else {
      console.log("📝 No existing manuals found. Creating new ones...");
    }

    // Insert manuals
    const result = await Manual.insertMany(manualsData);
    console.log(`\n✅ Successfully created ${result.length} manuals\n`);

    // Display created manuals
    result.forEach((manual) => {
      console.log(`  📖 Week ${manual.week} (${manual.month}): ${manual.title}`);
    });

    console.log("\n✅ All manuals created successfully!");
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error creating manuals:", error.message);
    process.exit(1);
  }
};

createManuals();