// import_students.js
import XLSX from 'xlsx';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function excelDateToJSDate(serial) {
    if (typeof serial !== 'number') return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

async function importStudents() {
    try {
        await signInWithEmailAndPassword(auth, "manu.caprian@gmail.com", "Manu123");
        console.log("Signed in successfully.");
    } catch (e) {
        console.error("Auth error:", e);
        process.exit(1);
    }

    const workbook = XLSX.readFile('Student.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} students to import...`);
    for (const row of rows) {
        const name = row['NAME']?.trim();
        const grade = row['GRADE'];
        const mobile = row['MOBILE NO'];
        const preferredDays = [];
        if (row['TUTION PERFERED DAY']) preferredDays.push(row['TUTION PERFERED DAY']);
        if (row['__EMPTY']) preferredDays.push(row['__EMPTY']);
        if (row['__EMPTY_1']) preferredDays.push(row['__EMPTY_1']);
        const timeSerial = row['TUTION PERFERED TIME'];
        const timeDate = excelDateToJSDate(timeSerial);
        const timeStr = timeDate ? timeDate.toTimeString().slice(0, 5) : null;

        try {
            const docRef = await addDoc(collection(db, "students"), {
                name,
                grade,
                mobile,
                preferredDays,
                preferredTime: timeStr,
                isActive: true,
            });
            console.log(`Imported ${name} with ID: ${docRef.id}`);
        } catch (e) {
            console.error(`Error importing ${name}:`, e);
        }
    }
    console.log("Import complete!");
}

importStudents();
