import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import Company from "./models/Company.js";
import PlacementExperience from "./models/PlacementExperience.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const companies = [
  {
    name: "NovaTech Solutions",
    website: "https://example.com/novatech",
    industry: "IT Services",
    headquarters: "Bengaluru, India",
    description: "A mid-sized product engineering company building cloud and data platforms for fintech clients.",
    roles: [{ title: "Software Engineer", package: "8.5 LPA", location: "Bengaluru", eligibility: "CGPA >= 7.0, CSE/IT/ECE" }],
    eligibilityCriteria: { minCgpa: 7, allowedBranches: ["CSE", "IT", "ECE"], backlogAllowed: true, graduationYear: [2025, 2026] },
    requiredSkills: ["JavaScript", "Node.js", "React", "SQL", "DSA"],
    hiringProcess: ["Aptitude Test", "Coding Round", "Technical Interview", "HR Round"],
    oaPatterns: [
      { round: "Coding Round", type: "coding", duration: "60 min", difficulty: "medium", description: "2 DSA problems on arrays, strings, and basic DP.", topics: ["Arrays", "Strings", "Dynamic Programming"] },
    ],
    interviewQuestions: [
      { question: "Explain the four pillars of OOP.", type: "technical", difficulty: "easy", round: "Technical Interview" },
      { question: "Design a URL shortener.", type: "technical", difficulty: "medium", round: "Technical Interview" },
      { question: "Why do you want to join NovaTech?", type: "behavioral", difficulty: "easy", round: "HR Round" },
    ],
    preparationResources: [
      { title: "DSA Practice Sheet", type: "practice", url: "https://example.com/dsa-sheet", topic: "Data Structures", description: "Curated 150 problems for placement prep." },
      { title: "System Design Primer", type: "course", url: "https://example.com/sysdesign", topic: "System Design", description: "Free GitHub course on scalable systems." },
    ],
    active: true,
  },
  {
    name: "CloudPeak Systems",
    website: "https://example.com/cloudpeak",
    industry: "Cloud Infrastructure",
    headquarters: "Hyderabad, India",
    description: "Cloud infrastructure and DevOps tooling company serving global enterprises.",
    roles: [{ title: "DevOps Engineer", package: "9.0 LPA", location: "Hyderabad", eligibility: "CGPA >= 7.5, any branch" }],
    eligibilityCriteria: { minCgpa: 7.5, allowedBranches: ["CSE", "IT", "ECE", "EEE"], backlogAllowed: false, graduationYear: [2025, 2026] },
    requiredSkills: ["Docker", "Kubernetes", "AWS", "Linux", "Shell Scripting"],
    hiringProcess: ["Coding Round", "System Design", "Technical Interview", "HR Round"],
    oaPatterns: [
      { round: "Coding Round", type: "coding", duration: "45 min", difficulty: "medium", description: "Scripting and shell-based automation problems.", topics: ["Shell Scripting", "File I/O", "Regex"] },
      { round: "System Design", type: "technical", duration: "30 min", difficulty: "hard", description: "Design a CI/CD pipeline for a microservices app.", topics: ["CI/CD", "Microservices", "Cloud Architecture"] },
    ],
    interviewQuestions: [
      { question: "Explain Kubernetes pod lifecycle.", type: "technical", difficulty: "medium", round: "Technical Interview" },
      { question: "How would you design a zero-downtime deployment?", type: "technical", difficulty: "hard", round: "System Design" },
    ],
    preparationResources: [
      { title: "Kubernetes Basics", type: "video", url: "https://example.com/k8s-basics", topic: "Kubernetes", description: "YouTube crash course on K8s fundamentals." },
      { title: "AWS Certified Solutions Architect", type: "course", url: "https://example.com/aws-sa", topic: "AWS", description: "Official AWS certification prep course." },
    ],
    active: true,
  },
  {
    name: "DataForge Analytics",
    website: "https://example.com/dataforge",
    industry: "Data & Analytics",
    headquarters: "Pune, India",
    description: "Analytics startup focused on BI dashboards and ML pipelines for retail.",
    roles: [{ title: "Data Analyst", package: "7.2 LPA", location: "Pune / Remote", eligibility: "CGPA >= 6.5, any branch" }],
    eligibilityCriteria: { minCgpa: 6.5, allowedBranches: ["CSE", "IT", "ECE", "MEC"], backlogAllowed: true, graduationYear: [2025, 2026] },
    requiredSkills: ["Python", "SQL", "Pandas", "Statistics", "Tableau"],
    hiringProcess: ["Aptitude Test", "SQL Round", "Technical Interview", "HR Round"],
    oaPatterns: [
      { round: "SQL Round", type: "coding", duration: "30 min", difficulty: "medium", description: "Write SQL queries — joins, window functions, aggregations.", topics: ["SQL", "Joins", "Window Functions"] },
    ],
    interviewQuestions: [
      { question: "Write a query to find the second highest salary.", type: "coding", difficulty: "easy", round: "SQL Round" },
      { question: "Explain the difference between UNION and UNION ALL.", type: "technical", difficulty: "easy", round: "Technical Interview" },
    ],
    preparationResources: [
      { title: "SQL Practice Platform", type: "practice", url: "https://example.com/sql-practice", topic: "SQL", description: "Interactive SQL exercises with real datasets." },
      { title: "Pandas Cookbook", type: "book", url: "https://example.com/pandas-book", topic: "Python", description: "Practical recipes for data manipulation in pandas." },
    ],
    active: true,
  },
  {
    name: "Quantum Labs",
    website: "https://example.com/quantumlabs",
    industry: "AI / ML Research",
    headquarters: "Bengaluru, India",
    description: "Applied AI lab building document intelligence and NLP products.",
    roles: [{ title: "ML Engineer", package: "12.0 LPA", location: "Bengaluru", eligibility: "CGPA >= 8.0, CSE/IT" }],
    eligibilityCriteria: { minCgpa: 8, allowedBranches: ["CSE", "IT"], backlogAllowed: false, graduationYear: [2025, 2026] },
    requiredSkills: ["Python", "Machine Learning", "Deep Learning", "PyTorch", "NLP"],
    hiringProcess: ["Coding Round", "ML Round", "Technical Interview", "HR Round"],
    oaPatterns: [
      { round: "Coding Round", type: "coding", duration: "60 min", difficulty: "hard", description: "Implement ML algorithms from scratch.", topics: ["Algorithms", "Linear Algebra", "Optimization"] },
      { round: "ML Round", type: "technical", duration: "45 min", difficulty: "hard", description: "Questions on regression, regularization, and evaluation metrics.", topics: ["Regression", "Regularization", "Evaluation Metrics"] },
    ],
    interviewQuestions: [
      { question: "Difference between L1 and L2 regularization.", type: "technical", difficulty: "medium", round: "ML Round" },
      { question: "Explain precision vs recall.", type: "technical", difficulty: "easy", round: "ML Round" },
      { question: "Implement k-means clustering from scratch.", type: "coding", difficulty: "hard", round: "Coding Round" },
    ],
    preparationResources: [
      { title: "Hands-On Machine Learning", type: "book", url: "https://example.com/homl", topic: "Machine Learning", description: "Comprehensive ML textbook with Scikit-Learn and TensorFlow." },
      { title: "Papers With Code", type: "article", url: "https://example.com/papers", topic: "Deep Learning", description: "Latest research papers with code implementations." },
    ],
    active: true,
  },
  {
    name: "GreenEnergy Robotics",
    website: "https://example.com/greenrobotics",
    industry: "Robotics / Hardware",
    headquarters: "Chennai, India",
    description: "Robotics startup building autonomous solutions for solar farm maintenance.",
    roles: [{ title: "Embedded Software Engineer", package: "6.8 LPA", location: "Chennai", eligibility: "CGPA >= 7.0, ECE/EEE/MEC" }],
    eligibilityCriteria: { minCgpa: 7, allowedBranches: ["ECE", "EEE", "MEC"], backlogAllowed: true, graduationYear: [2025] },
    requiredSkills: ["C++", "Embedded Systems", "RTOS", "Arduino", "Sensor Integration"],
    hiringProcess: ["Technical Test", "Technical Interview", "HR Round"],
    oaPatterns: [
      { round: "Technical Test", type: "coding", duration: "90 min", difficulty: "hard", description: "Embedded C/C++ problems on memory management and interrupts.", topics: ["C++", "Pointers", "Interrupts", "Memory"] },
    ],
    interviewQuestions: [
      { question: "Explain interrupt handling in RTOS.", type: "technical", difficulty: "medium", round: "Technical Interview" },
      { question: "How do you debug a memory leak in embedded C?", type: "technical", difficulty: "hard", round: "Technical Interview" },
    ],
    preparationResources: [
      { title: "Embedded C Tutorial", type: "course", url: "https://example.com/embedded-c", topic: "Embedded Systems", description: "Free course on embedded C programming." },
      { title: "RTOS Concepts", type: "video", url: "https://example.com/rtos", topic: "RTOS", description: "Video series on real-time operating systems." },
    ],
    active: false,
  },
  {
    name: "FinEdge Capital",
    website: "https://example.com/finedge",
    industry: "FinTech",
    headquarters: "Mumbai, India",
    description: "FinTech company providing algorithmic trading and portfolio management platforms.",
    roles: [{ title: "Backend Developer", package: "11.0 LPA", location: "Mumbai", eligibility: "CGPA >= 7.5, CSE/IT" }],
    eligibilityCriteria: { minCgpa: 7.5, allowedBranches: ["CSE", "IT"], backlogAllowed: false, graduationYear: [2025, 2026] },
    requiredSkills: ["Java", "Spring Boot", "PostgreSQL", "Data Structures", "System Design"],
    hiringProcess: ["Online Assessment", "Coding Interview", "System Design", "HR Round"],
    oaPatterns: [
      { round: "Online Assessment", type: "coding", duration: "75 min", difficulty: "hard", description: "3 DSA problems with a focus on trees, graphs, and dynamic programming.", topics: ["Trees", "Graphs", "DP"] },
    ],
    interviewQuestions: [
      { question: "Design a rate limiter for an API gateway.", type: "technical", difficulty: "hard", round: "System Design" },
      { question: "Implement an LRU cache.", type: "coding", difficulty: "medium", round: "Coding Interview" },
    ],
    preparationResources: [
      { title: "Java Concurrency Tutorial", type: "article", url: "https://example.com/java-concurrency", topic: "Java", description: "Deep dive into Java threading and concurrency." },
      { title: "System Design Interview", type: "book", url: "https://example.com/sdi", topic: "System Design", description: "Step-by-step system design interview prep." },
    ],
    active: true,
  },
  {
    name: "MediSoft Health",
    website: "https://example.com/medisoft",
    industry: "HealthTech",
    headquarters: "Bengaluru, India",
    description: "HealthTech startup building electronic health records and telemedicine platforms.",
    roles: [{ title: "Full Stack Developer", package: "9.5 LPA", location: "Bengaluru / Remote", eligibility: "CGPA >= 7.0, CSE/IT/ECE" }],
    eligibilityCriteria: { minCgpa: 7, allowedBranches: ["CSE", "IT", "ECE"], backlogAllowed: true, graduationYear: [2025, 2026] },
    requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "REST APIs"],
    hiringProcess: ["Coding Round", "Technical Interview", "Managerial Round", "HR Round"],
    oaPatterns: [
      { round: "Coding Round", type: "coding", duration: "60 min", difficulty: "medium", description: "2 problems — one on string manipulation, one on API design.", topics: ["Strings", "API Design", "Arrays"] },
    ],
    interviewQuestions: [
      { question: "How would you design a REST API for appointment booking?", type: "technical", difficulty: "medium", round: "Technical Interview" },
      { question: "Explain React component lifecycle methods.", type: "technical", difficulty: "easy", round: "Technical Interview" },
    ],
    preparationResources: [
      { title: "React Official Docs", type: "article", url: "https://example.com/react-docs", topic: "React", description: "Official React documentation and tutorials." },
      { title: "REST API Design Best Practices", type: "article", url: "https://example.com/rest-api", topic: "API Design", description: "Guide to designing RESTful APIs." },
    ],
    active: true,
  },
  {
    name: "ByteForge Games",
    website: "https://example.com/byteforge",
    industry: "Gaming",
    headquarters: "Pune, India",
    description: "Game development studio creating mobile and PC games with Unity.",
    roles: [{ title: "Game Developer", package: "8.0 LPA", location: "Pune", eligibility: "CGPA >= 6.5, CSE/IT" }],
    eligibilityCriteria: { minCgpa: 6.5, allowedBranches: ["CSE", "IT"], backlogAllowed: true, graduationYear: [2025, 2026] },
    requiredSkills: ["C#", "Unity", "Game Physics", "3D Math", "Problem Solving"],
    hiringProcess: ["Coding Test", "Technical Interview", "Practical Round", "HR Round"],
    oaPatterns: [
      { round: "Coding Test", type: "coding", duration: "60 min", difficulty: "medium", description: "C# problems on data structures and game logic.", topics: ["C#", "Data Structures", "Game Logic"] },
    ],
    interviewQuestions: [
      { question: "Explain the game loop architecture.", type: "technical", difficulty: "medium", round: "Technical Interview" },
      { question: "How would you optimize a Unity game for mobile?", type: "technical", difficulty: "hard", round: "Practical Round" },
    ],
    preparationResources: [
      { title: "Unity Learn", type: "course", url: "https://example.com/unity-learn", topic: "Unity", description: "Official Unity learning platform." },
      { title: "Game Programming Patterns", type: "book", url: "https://example.com/gpp", topic: "Game Development", description: "Patterns and techniques for game code architecture." },
    ],
    active: true,
  },
];

async function upsertCompany(seed) {
  const existing = await Company.findOne({ name: seed.name });
  if (existing) {
    await Company.updateOne({ _id: existing._id }, { $set: seed });
    console.log(`[seed] Updated company: ${seed.name}`);
    return existing;
  }
  const created = await Company.create(seed);
  console.log(`[seed] Created company: ${seed.name}`);
  return created;
}

async function upsertExperience(seed) {
  const exists = await PlacementExperience.findOne({
    company: seed.company,
    studentName: seed.studentName,
  });
  if (exists) {
    await PlacementExperience.updateOne({ _id: exists._id }, { $set: seed });
    console.log(`[seed] Updated experience: ${seed.studentName}`);
    return;
  }
  await PlacementExperience.create(seed);
  console.log(`[seed] Created experience: ${seed.studentName}`);
}

async function run() {
  console.log("[seed] Starting seed process...");
  const conn = await connectDB();
  if (!conn) {
    console.error("[seed] Could not connect to MongoDB. Aborting seed.");
    process.exitCode = 1;
    return;
  }

  try {
    const createdCompanies = [];
    for (const seed of companies) {
      const company = await upsertCompany(seed);
      createdCompanies.push(company);
    }

    const [nova, cloud, dataforge, quantum, green, fine, medi, byte] = createdCompanies;

    const experiences = [
      {
        company: nova._id,
        studentName: "Aarav Sharma",
        college: "Delhi Technological University",
        branch: "CSE",
        graduationYear: 2024,
        role: "Software Engineer",
        package: "8.5 LPA",
        rounds: [
          { name: "Aptitude Test", type: "aptitude", details: "30 questions in 40 minutes, quantitative + logical.", difficulty: "easy" },
          { name: "Coding Round", type: "coding", details: "2 DSA problems on arrays and strings.", difficulty: "medium", questions: ["Find the first non-repeating character", "Merge overlapping intervals"], questionsAsked: ["Find the first non-repeating character", "Merge overlapping intervals"] },
          { name: "Technical Interview", type: "technical", details: "Focused on OOP, DBMS, and a small system design discussion.", difficulty: "medium", questions: ["Explain the four pillars of OOP", "Design a URL shortener"], questionsAsked: ["Explain the four pillars of OOP", "Design a URL shortener"] },
          { name: "HR Round", type: "hr", details: "Behavioral questions and salary discussion.", difficulty: "easy" },
        ],
        questionsAsked: ["Find the first non-repeating character", "Merge overlapping intervals", "Explain the four pillars of OOP", "Design a URL shortener"],
        outcome: "offered",
        difficulty: "medium",
        overallExperience: "The process was well-structured. The coding round was standard DSA and the interviewers were friendly.",
        tips: "Be thorough with DSA basics and practice explaining your projects clearly.",
      },
      {
        company: cloud._id,
        studentName: "Priya Iyer",
        college: "VIT Vellore",
        branch: "IT",
        graduationYear: 2024,
        role: "DevOps Engineer",
        package: "9.0 LPA",
        rounds: [
          { name: "Coding Round", type: "coding", details: "Scripting and shell questions.", difficulty: "medium" },
          { name: "System Design", type: "technical", details: "Designing a CI/CD pipeline for a microservices app.", difficulty: "hard", questions: ["Design a CI/CD pipeline for a microservices app"], questionsAsked: ["Design a CI/CD pipeline for a microservices app"] },
          { name: "Technical Interview", type: "technical", details: "Docker, Kubernetes, and AWS basics.", difficulty: "medium", questions: ["Explain Kubernetes pod lifecycle"], questionsAsked: ["Explain Kubernetes pod lifecycle"] },
          { name: "HR Round", type: "hr", difficulty: "easy" },
        ],
        questionsAsked: ["Design a CI/CD pipeline for a microservices app", "Explain Kubernetes pod lifecycle"],
        outcome: "offered",
        difficulty: "hard",
        overallExperience: "System design round was challenging but fair. Having a real Kubernetes project on my resume helped a lot.",
        tips: "Hands-on Docker and a basic Kubernetes project really helped me stand out.",
      },
      {
        company: dataforge._id,
        studentName: "Rohan Mehta",
        college: "COEP Pune",
        branch: "ECE",
        graduationYear: 2024,
        role: "Data Analyst",
        package: "7.2 LPA",
        rounds: [
          { name: "Aptitude Test", type: "aptitude", difficulty: "easy" },
          { name: "SQL Round", type: "coding", questions: ["Write a query to find second highest salary"], questionsAsked: ["Write a query to find second highest salary"], difficulty: "medium" },
          { name: "Technical Interview", type: "technical", details: "Python, pandas, and statistics.", difficulty: "medium", questions: ["Explain the difference between UNION and UNION ALL"], questionsAsked: ["Explain the difference between UNION and UNION ALL"] },
          { name: "HR Round", type: "hr", difficulty: "easy" },
        ],
        questionsAsked: ["Write a query to find second highest salary", "Explain the difference between UNION and UNION ALL"],
        outcome: "rejected",
        difficulty: "medium",
        overallExperience: "SQL round was tricky — window functions were the key. I struggled with the statistics portion of the technical interview.",
        tips: "Practice SQL window functions and probability problems thoroughly.",
      },
      {
        company: quantum._id,
        studentName: "Sneha Reddy",
        college: "BITS Pilani",
        branch: "CSE",
        graduationYear: 2024,
        role: "ML Engineer",
        package: "12.0 LPA",
        rounds: [
          { name: "Coding Round", type: "coding", questions: ["Implement k-means from scratch"], questionsAsked: ["Implement k-means from scratch"], difficulty: "hard" },
          { name: "ML Round", type: "technical", details: "Questions on regression, regularization, and evaluation metrics.", difficulty: "hard", questions: ["Difference between L1 and L2 regularization", "Explain precision vs recall"], questionsAsked: ["Difference between L1 and L2 regularization", "Explain precision vs recall"] },
          { name: "Technical Interview", type: "technical", details: "End-to-end ML pipeline discussion.", difficulty: "hard" },
          { name: "HR Round", type: "hr", difficulty: "easy" },
        ],
        questionsAsked: ["Implement k-means from scratch", "Difference between L1 and L2 regularization", "Explain precision vs recall"],
        outcome: "offered",
        difficulty: "hard",
        overallExperience: "Very rigorous process. They went deep into every project on my resume and asked about the math behind each ML concept.",
        tips: "Be ready to explain every line of your ML projects and the math behind them.",
      },
      {
        company: fine._id,
        studentName: "Karthik Nair",
        college: "NIT Trichy",
        branch: "CSE",
        graduationYear: 2024,
        role: "Backend Developer",
        package: "11.0 LPA",
        rounds: [
          { name: "Online Assessment", type: "coding", details: "3 DSA problems on trees, graphs, and DP.", difficulty: "hard", questions: ["Implement LRU cache", "Lowest common ancestor in a BST"], questionsAsked: ["Implement LRU cache", "Lowest common ancestor in a BST"] },
          { name: "Coding Interview", type: "coding", details: "Live coding on a shared editor.", difficulty: "medium", questions: ["Implement an LRU cache"], questionsAsked: ["Implement an LRU cache"] },
          { name: "System Design", type: "technical", details: "Design a rate limiter for an API gateway.", difficulty: "hard", questions: ["Design a rate limiter for an API gateway"], questionsAsked: ["Design a rate limiter for an API gateway"] },
          { name: "HR Round", type: "hr", difficulty: "easy" },
        ],
        questionsAsked: ["Implement LRU cache", "Lowest common ancestor in a BST", "Design a rate limiter for an API gateway"],
        outcome: "offered",
        difficulty: "hard",
        overallExperience: "FinEdge had the toughest OA of all companies I sat for. System design round was intense but the interviewer guided me well.",
        tips: "Practice hard DSA problems consistently for 2 months. Grokking the system design interview is a must.",
      },
      {
        company: medi._id,
        studentName: "Ananya Gupta",
        college: "IIIT Hyderabad",
        branch: "CSE",
        graduationYear: 2024,
        role: "Full Stack Developer",
        package: "9.5 LPA",
        rounds: [
          { name: "Coding Round", type: "coding", details: "2 problems — one on string manipulation, one on API design.", difficulty: "medium", questions: ["Valid palindrome with edge cases", "Design a REST API for appointments"], questionsAsked: ["Valid palindrome with edge cases", "Design a REST API for appointments"] },
          { name: "Technical Interview", type: "technical", details: "React concepts and API design.", difficulty: "medium", questions: ["Explain React component lifecycle methods", "How would you design a REST API for appointment booking?"], questionsAsked: ["Explain React component lifecycle methods", "How would you design a REST API for appointment booking?"] },
          { name: "Managerial Round", type: "technical", details: "Past project discussion and architecture.", difficulty: "medium" },
          { name: "HR Round", type: "hr", difficulty: "easy" },
        ],
        questionsAsked: ["Valid palindrome with edge cases", "Explain React component lifecycle methods", "How would you design a REST API for appointment booking?"],
        outcome: "offered",
        difficulty: "medium",
        overallExperience: "Great experience overall. Interviewers were very supportive and interested in my past projects.",
        tips: "Have one solid full-stack project on your resume and be ready to explain every architectural decision.",
      },
      {
        company: byte._id,
        studentName: "Vikram Patel",
        college: "BITS Goa",
        branch: "CSE",
        graduationYear: 2024,
        role: "Game Developer",
        package: "8.0 LPA",
        rounds: [
          { name: "Coding Test", type: "coding", details: "C# problems on data structures and game logic.", difficulty: "medium", questions: ["Implement a simple game loop in C#", "Pathfinding in a grid"], questionsAsked: ["Implement a simple game loop in C#", "Pathfinding in a grid"] },
          { name: "Technical Interview", type: "technical", details: "Game architecture and Unity internals.", difficulty: "medium", questions: ["Explain the game loop architecture"], questionsAsked: ["Explain the game loop architecture"] },
          { name: "Practical Round", type: "technical", details: "Build a small Unity prototype.", difficulty: "hard", questions: ["How would you optimize a Unity game for mobile?"], questionsAsked: ["How would you optimize a Unity game for mobile?"] },
          { name: "HR Round", type: "hr", difficulty: "easy" },
        ],
        questionsAsked: ["Implement a simple game loop in C#", "Pathfinding in a grid", "Explain the game loop architecture", "How would you optimize a Unity game for mobile?"],
        outcome: "rejected",
        difficulty: "hard",
        overallExperience: "The practical round was the hardest — building a working Unity prototype under time pressure. I ran out of time on the optimization question.",
        tips: "Build at least one complete Unity game before interviewing. Optimize for mobile from the start.",
      },
      {
        company: green._id,
        studentName: "Divya Krishnan",
        college: "Anna University",
        branch: "ECE",
        graduationYear: 2024,
        role: "Embedded Software Engineer",
        package: "6.8 LPA",
        rounds: [
          { name: "Technical Test", type: "coding", details: "Embedded C/C++ problems on memory management and interrupts.", difficulty: "hard", questions: ["Explain interrupt handling in RTOS", "How do you debug a memory leak in embedded C?"], questionsAsked: ["Explain interrupt handling in RTOS", "How do you debug a memory leak in embedded C?"] },
          { name: "Technical Interview", type: "technical", details: "Deep dive into embedded systems projects.", difficulty: "medium", questions: ["Explain interrupt handling in RTOS"], questionsAsked: ["Explain interrupt handling in RTOS"] },
          { name: "HR Round", type: "hr", difficulty: "easy" },
        ],
        questionsAsked: ["Explain interrupt handling in RTOS", "How do you debug a memory leak in embedded C?"],
        outcome: "offered",
        difficulty: "hard",
        overallExperience: "The technical test was challenging but very relevant to the role. My embedded systems project on sensor integration gave me an edge.",
        tips: "Have a solid embedded systems project. Brush up on RTOS concepts and interrupt handling.",
      },
    ];

    for (const exp of experiences) {
      await upsertExperience(exp);
    }

    const companyCount = await Company.countDocuments();
    const expCount = await PlacementExperience.countDocuments();
    console.log(`[seed] Done. Companies: ${companyCount}, Experiences: ${expCount}`);
  } catch (err) {
    console.error("[seed] Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("[seed] MongoDB connection closed.");
  }
}

run();
