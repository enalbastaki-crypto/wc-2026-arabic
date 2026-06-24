import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, CalendarDays, BarChart3, Settings, Lock, Check, Save, UserCircle, Edit2, AlertCircle, Clock, LogIn, UserPlus, Trash2, ShieldAlert, Eye, Download } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, writeBatch } from 'firebase/firestore';

// --- إعدادات قاعدة البيانات الفايربيس الرسمية للتطبيق العربي ---
const firebaseConfig = {
  apiKey: "AIzaSyC8S_ucFYD0yuwmnwHGrjMwMnCUKKitmXo",
  authDomain: "wc-2026-arabic.firebaseapp.com",
  projectId: "wc-2026-arabic",
  storageBucket: "wc-2026-arabic.firebasestorage.app",
  messagingSenderId: "304563147258",
  appId: "1:304563147258:web:8ed60fec479f142fab9443"
};

// تهيئة الخدمة
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'world-cup-app-id-ar';

// --- الثوابت والإعدادات الثابتة ---
const ADMIN_PASSCODE = '6014'; 
const ADMIN_USERS = ['إبراهيم نادر', 'حمد خالد'];


// جدول المباريات الشامل والكامل (104 مباراة) المحدث بناءً على ملف الإكسل الأخير وبتوقيت البحرين (GMT+3)
const BASE_MATCHES = [
  // --- دور المجموعات ---
  { id: "m1", order: 1, group: 'دور المجموعات - المجموعة A', date: '2026-06-11', time: '22:00', teamA: 'المكسيك', teamB: 'جنوب إفريقيا', isLocked: false, actualA: null, actualB: null },
  { id: "m2", order: 2, group: 'دور المجموعات - المجموعة A', date: '2026-06-12', time: '05:00', teamA: 'كوريا الجنوبية', teamB: 'تشيكيا', isLocked: false, actualA: null, actualB: null },
  { id: "m3", order: 3, group: 'دور المجموعات - المجموعة B', date: '2026-06-12', time: '22:00', teamA: 'كندا', teamB: 'البوسنة والهرسك', isLocked: false, actualA: null, actualB: null },
  { id: "m4", order: 4, group: 'دور المجموعات - المجموعة D', date: '2026-06-13', time: '04:00', teamA: 'الولايات المتحدة', teamB: 'باراغواي', isLocked: false, actualA: null, actualB: null },
  { id: "m5", order: 5, group: 'دور المجموعات - المجموعة B', date: '2026-06-13', time: '22:00', teamA: 'قطر', teamB: 'سويسرا', isLocked: false, actualA: null, actualB: null },
  { id: "m6", order: 6, group: 'دور المجموعات - المجموعة C', date: '2026-06-14', time: '01:00', teamA: 'البرازيل', teamB: 'المغرب', isLocked: false, actualA: null, actualB: null },
  { id: "m7", order: 7, group: 'دور المجموعات - المجموعة C', date: '2026-06-14', time: '04:00', teamA: 'هايتي', teamB: 'اسكتلندا', isLocked: false, actualA: null, actualB: null },
  { id: "m8", order: 8, group: 'دور المجموعات - المجموعة D', date: '2026-06-14', time: '07:00', teamA: 'أستراليا', teamB: 'تركيا', isLocked: false, actualA: null, actualB: null },
  { id: "m9", order: 9, group: 'دور المجموعات - المجموعة E', date: '2026-06-14', time: '20:00', teamA: 'ألمانيا', teamB: 'كوراساو', isLocked: false, actualA: null, actualB: null },
  { id: "m10", order: 10, group: 'دور المجموعات - المجموعة F', date: '2026-06-14', time: '23:00', teamA: 'هولندا', teamB: 'اليابان', isLocked: false, actualA: null, actualB: null },
  { id: "m11", order: 11, group: 'دور المجموعات - المجموعة E', date: '2026-06-15', time: '02:00', teamA: 'ساحل العاج', teamB: 'الإكوادور', isLocked: false, actualA: null, actualB: null },
  { id: "m12", order: 12, group: 'دور المجموعات - المجموعة F', date: '2026-06-15', time: '05:00', teamA: 'السويد', teamB: 'تونس', isLocked: false, actualA: null, actualB: null },
  { id: "m13", order: 13, group: 'دور المجموعات - المجموعة H', date: '2026-06-15', time: '19:00', teamA: 'إسبانيا', teamB: 'الرأس الأخضر', isLocked: false, actualA: null, actualB: null },
  { id: "m14", order: 14, group: 'دور المجموعات - المجموعة G', date: '2026-06-15', time: '22:00', teamA: 'بلجيكا', teamB: 'مصر', isLocked: false, actualA: null, actualB: null },
  { id: "m15", order: 15, group: 'دور المجموعات - المجموعة H', date: '2026-06-16', time: '01:00', teamA: 'السعودية', teamB: 'أوروغواي', isLocked: false, actualA: null, actualB: null },
  { id: "m16", order: 16, group: 'دور المجموعات - المجموعة G', date: '2026-06-16', time: '04:00', teamA: 'إيران', teamB: 'نيوزيلندا', isLocked: false, actualA: null, actualB: null },
  { id: "m17", order: 17, group: 'دور المجموعات - المجموعة I', date: '2026-06-16', time: '22:00', teamA: 'فرنسا', teamB: 'السنغال', isLocked: false, actualA: null, actualB: null },
  { id: "m18", order: 18, group: 'دور المجموعات - المجموعة I', date: '2026-06-17', time: '01:00', teamA: 'العراق', teamB: 'النرويج', isLocked: false, actualA: null, actualB: null },
  { id: "m19", order: 19, group: 'دور المجموعات - المجموعة J', date: '2026-06-17', time: '04:00', teamA: 'الأرجنتين', teamB: 'الجزائر', isLocked: false, actualA: null, actualB: null },
  { id: "m20", order: 20, group: 'دور المجموعات - المجموعة J', date: '2026-06-17', time: '07:00', teamA: 'النمسا', teamB: 'الأردن', isLocked: false, actualA: null, actualB: null },
  { id: "m21", order: 21, group: 'دور المجموعات - المجموعة K', date: '2026-06-17', time: '20:00', teamA: 'البرتغال', teamB: 'جمهورية الكونغو', isLocked: false, actualA: null, actualB: null },
  { id: "m22", order: 22, group: 'دور المجموعات - المجموعة L', date: '2026-06-17', time: '23:00', teamA: 'إنجلترا', teamB: 'كرواتيا', isLocked: false, actualA: null, actualB: null },
  { id: "m23", order: 23, group: 'دور المجموعات - المجموعة L', date: '2026-06-18', time: '02:00', teamA: 'غانا', teamB: 'بنما', isLocked: false, actualA: null, actualB: null },
  { id: "m24", order: 24, group: 'دور المجموعات - المجموعة K', date: '2026-06-18', time: '05:00', teamA: 'أوزبكستان', teamB: 'كولومبيا', isLocked: false, actualA: null, actualB: null },
  { id: "m25", order: 25, group: 'دور المجموعات - المجموعة A', date: '2026-06-18', time: '19:00', teamA: 'تشيكيا', teamB: 'جنوب إفريقيا', isLocked: false, actualA: null, actualB: null },
  { id: "m26", order: 26, group: 'دور المجموعات - المجموعة B', date: '2026-06-18', time: '22:00', teamA: 'سويسرا', teamB: 'البوسنة والهرسك', isLocked: false, actualA: null, actualB: null },
  { id: "m27", order: 27, group: 'دور المجموعات - المجموعة B', date: '2026-06-19', time: '01:00', teamA: 'كندا', teamB: 'قطر', isLocked: false, actualA: null, actualB: null },
  { id: "m28", order: 28, group: 'دور المجموعات - المجموعة A', date: '2026-06-19', time: '04:00', teamA: 'المكسيك', teamB: 'كوريا الجنوبية', isLocked: false, actualA: null, actualB: null },
  { id: "m29", order: 29, group: 'دور المجموعات - المجموعة D', date: '2026-06-19', time: '22:00', teamA: 'الولايات المتحدة', teamB: 'أستراليا', isLocked: false, actualA: null, actualB: null },
  { id: "m30", order: 30, group: 'دور المجموعات - المجموعة C', date: '2026-06-20', time: '01:00', teamA: 'اسكتلندا', teamB: 'المغرب', isLocked: false, actualA: null, actualB: null },
  { id: "m31", order: 31, group: 'دور المجموعات - المجموعة C', date: '2026-06-20', time: '03:30', teamA: 'البرازيل', teamB: 'هايتي', isLocked: false, actualA: null, actualB: null },
  { id: "m32", order: 32, group: 'دور المجموعات - المجموعة D', date: '2026-06-20', time: '07:00', teamA: 'تركيا', teamB: 'باراغواي', isLocked: false, actualA: null, actualB: null },
  { id: "m33", order: 33, group: 'دور المجموعات - المجموعة F', date: '2026-06-20', time: '20:00', teamA: 'هولندا', teamB: 'السويد', isLocked: false, actualA: null, actualB: null },
  { id: "m34", order: 34, group: 'دور المجموعات - المجموعة E', date: '2026-06-20', time: '23:00', teamA: 'ألمانيا', teamB: 'ساحل العاج', isLocked: false, actualA: null, actualB: null },
  { id: "m35", order: 35, group: 'دور المجموعات - المجموعة E', date: '2026-06-21', time: '03:00', teamA: 'الإكوادور', teamB: 'كوراساو', isLocked: false, actualA: null, actualB: null },
  { id: "m36", order: 36, group: 'دور المجموعات - المجموعة F', date: '2026-06-21', time: '07:00', teamA: 'تونس', teamB: 'اليابان', isLocked: false, actualA: null, actualB: null },
  { id: "m37", order: 37, group: 'دور المجموعات - المجموعة H', date: '2026-06-21', time: '19:00', teamA: 'إسبانيا', teamB: 'السعودية', isLocked: false, actualA: null, actualB: null },
  { id: "m38", order: 38, group: 'دور المجموعات - المجموعة G', date: '2026-06-21', time: '22:00', teamA: 'بلجيكا', teamB: 'إيران', isLocked: false, actualA: null, actualB: null },
  { id: "m39", order: 39, group: 'دور المجموعات - المجموعة H', date: '2026-06-22', time: '01:00', teamA: 'أوروغواي', teamB: 'الرأس الأخضر', isLocked: false, actualA: null, actualB: null },
  { id: "m40", order: 40, group: 'دور المجموعات - المجموعة G', date: '2026-06-22', time: '04:00', teamA: 'نيوزيلندا', teamB: 'مصر', isLocked: false, actualA: null, actualB: null },
  { id: "m41", order: 41, group: 'دور المجموعات - المجموعة J', date: '2026-06-22', time: '20:00', teamA: 'الأرجنتين', teamB: 'النمسا', isLocked: false, actualA: null, actualB: null },
  { id: "m42", order: 42, group: 'دور المجموعات - المجموعة I', date: '2026-06-23', time: '00:00', teamA: 'فرنسا', teamB: 'العراق', isLocked: false, actualA: null, actualB: null },
  { id: "m43", order: 43, group: 'دور المجموعات - المجموعة I', date: '2026-06-23', time: '03:00', teamA: 'النرويج', teamB: 'السنغال', isLocked: false, actualA: null, actualB: null },
  { id: "m44", order: 44, group: 'دور المجموعات - المجموعة J', date: '2026-06-23', time: '06:00', teamA: 'الأردن', teamB: 'الجزائر', isLocked: false, actualA: null, actualB: null },
  { id: "m45", order: 45, group: 'دور المجموعات - المجموعة K', date: '2026-06-23', time: '20:00', teamA: 'البرتغال', teamB: 'أوزبكستان', isLocked: false, actualA: null, actualB: null },
  { id: "m46", order: 46, group: 'دور المجموعات - المجموعة L', date: '2026-06-23', time: '23:00', teamA: 'إنجلترا', teamB: 'غانا', isLocked: false, actualA: null, actualB: null },
  { id: "m47", order: 47, group: 'دور المجموعات - المجموعة L', date: '2026-06-24', time: '02:00', teamA: 'بنما', teamB: 'كرواتيا', isLocked: false, actualA: null, actualB: null },
  { id: "m48", order: 48, group: 'دور المجموعات - المجموعة K', date: '2026-06-24', time: '05:00', teamA: 'كولومبيا', teamB: 'جمهورية الكونغو', isLocked: false, actualA: null, actualB: null },
  { id: "m49", order: 49, group: 'دور المجموعات - المجموعة B', date: '2026-06-24', time: '22:00', teamA: 'سويسرا', teamB: 'كندا', isLocked: false, actualA: null, actualB: null },
  { id: "m50", order: 50, group: 'دور المجموعات - المجموعة B', date: '2026-06-24', time: '22:00', teamA: 'البوسنة والهرسك', teamB: 'قطر', isLocked: false, actualA: null, actualB: null },
  { id: "m51", order: 51, group: 'دور المجموعات - المجموعة C', date: '2026-06-25', time: '01:00', teamA: 'اسكتلندا', teamB: 'البرازيل', isLocked: false, actualA: null, actualB: null },
  { id: "m52", order: 52, group: 'دور المجموعات - المجموعة C', date: '2026-06-25', time: '01:00', teamA: 'المغرب', teamB: 'هايتي', isLocked: false, actualA: null, actualB: null },
  { id: "m53", order: 53, group: 'دور المجموعات - المجموعة A', date: '2026-06-25', time: '04:00', teamA: 'تشيكيا', teamB: 'المكسيك', isLocked: false, actualA: null, actualB: null },
  { id: "m54", order: 54, group: 'دور المجموعات - المجموعة A', date: '2026-06-25', time: '04:00', teamA: 'جنوب إفريقيا', teamB: 'كوريا الجنوبية', isLocked: false, actualA: null, actualB: null },
  { id: "m55", order: 55, group: 'دور المجموعات - المجموعة E', date: '2026-06-25', time: '23:00', teamA: 'كوراساو', teamB: 'ساحل العاج', isLocked: false, actualA: null, actualB: null },
  { id: "m56", order: 56, group: 'دور المجموعات - المجموعة E', date: '2026-06-25', time: '23:00', teamA: 'الإكوادور', teamB: 'ألمانيا', isLocked: false, actualA: null, actualB: null },
  { id: "m57", order: 57, group: 'دور المجموعات - المجموعة F', date: '2026-06-26', time: '02:00', teamA: 'اليابان', teamB: 'السويد', isLocked: false, actualA: null, actualB: null },
  { id: "m58", order: 58, group: 'دور المجموعات - المجموعة F', date: '2026-06-26', time: '02:00', teamA: 'تونس', teamB: 'هولندا', isLocked: false, actualA: null, actualB: null },
  { id: "m59", order: 59, group: 'دور المجموعات - المجموعة D', date: '2026-06-26', time: '05:00', teamA: 'تركيا', teamB: 'الولايات المتحدة', isLocked: false, actualA: null, actualB: null },
  { id: "m60", order: 60, group: 'دور المجموعات - المجموعة D', date: '2026-06-26', time: '05:00', teamA: 'باراغواي', teamB: 'أستراليا', isLocked: false, actualA: null, actualB: null },
  { id: "m61", order: 61, group: 'دور المجموعات - المجموعة I', date: '2026-06-26', time: '22:00', teamA: 'النرويج', teamB: 'فرنسا', isLocked: false, actualA: null, actualB: null },
  { id: "m62", order: 62, group: 'دور المجموعات - المجموعة I', date: '2026-06-26', time: '22:00', teamA: 'السنغال', teamB: 'العراق', isLocked: false, actualA: null, actualB: null },
  { id: "m63", order: 63, group: 'دور المجموعات - المجموعة H', date: '2026-06-27', time: '03:00', teamA: 'الرأس الأخضر', teamB: 'السعودية', isLocked: false, actualA: null, actualB: null },
  { id: "m64", order: 64, group: 'دور المجموعات - المجموعة H', date: '2026-06-27', time: '03:00', teamA: 'أوروغواي', teamB: 'إسبانيا', isLocked: false, actualA: null, actualB: null },
  { id: "m65", order: 65, group: 'دور المجموعات - المجموعة G', date: '2026-06-27', time: '06:00', teamA: 'مصر', teamB: 'إيران', isLocked: false, actualA: null, actualB: null },
  { id: "m66", order: 66, group: 'دور المجموعات - المجموعة G', date: '2026-06-27', time: '06:00', teamA: 'نيوزيلندا', teamB: 'بلجيكا', isLocked: false, actualA: null, actualB: null },
  { id: "m67", order: 67, group: 'دور المجموعات - المجموعة L', date: '2026-06-28', time: '00:00', teamA: 'بنما', teamB: 'إنجلترا', isLocked: false, actualA: null, actualB: null },
  { id: "m68", order: 68, group: 'دور المجموعات - المجموعة L', date: '2026-06-28', time: '00:00', teamA: 'كرواتيا', teamB: 'غانا', isLocked: false, actualA: null, actualB: null },
  { id: "m69", order: 69, group: 'دور المجموعات - المجموعة K', date: '2026-06-28', time: '02:30', teamA: 'كولومبيا', teamB: 'البرتغال', isLocked: false, actualA: null, actualB: null },
  { id: "m70", order: 70, group: 'دور المجموعات - المجموعة K', date: '2026-06-28', time: '02:30', teamA: 'جمهورية الكونغو', teamB: 'أوزبكستان', isLocked: false, actualA: null, actualB: null },
  { id: "m71", order: 71, group: 'دور المجموعات - المجموعة J', date: '2026-06-28', time: '05:00', teamA: 'الجزائر', teamB: 'النمسا', isLocked: false, actualA: null, actualB: null },
  { id: "m72", order: 72, group: 'دور المجموعات - المجموعة J', date: '2026-06-28', time: '05:00', teamA: 'الأردن', teamB: 'الأرجنتين', isLocked: false, actualA: null, actualB: null },

  // --- دور الـ 32 الإقصائي ---
  { id: "m73", order: 73, group: 'دور الـ 32', date: '2026-06-28', time: '22:00', teamA: 'ثاني المجموعة A', teamB: 'ثاني المجموعة B', isLocked: false, actualA: null, actualB: null },
  { id: "m74", order: 74, group: 'دور الـ 32', date: '2026-06-29', time: '23:30', teamA: 'أول المجموعة E', teamB: 'ثالث (A/B/C/D/F)', isLocked: false, actualA: null, actualB: null },
  { id: "m75", order: 75, group: 'دور الـ 32', date: '2026-06-30', time: '04:00', teamA: 'أول المجموعة F', teamB: 'ثاني المجموعة C', isLocked: false, actualA: null, actualB: null },
  { id: "m76", order: 76, group: 'دور الـ 32', date: '2026-06-29', time: '20:00', teamA: 'أول المجموعة C', teamB: 'ثاني المجموعة F', isLocked: false, actualA: null, actualB: null },
  { id: "m77", order: 77, group: 'دور الـ 32', date: '2026-07-01', time: '00:00', teamA: 'أول المجموعة I', teamB: 'ثالث (C/D/F/G/H)', isLocked: false, actualA: null, actualB: null },
  { id: "m78", order: 78, group: 'دور الـ 32', date: '2026-06-30', time: '20:00', teamA: 'ثاني المجموعة E', teamB: 'ثاني المجموعة I', isLocked: false, actualA: null, actualB: null },
  { id: "m79", order: 79, group: 'دور الـ 32', date: '2026-07-01', time: '04:00', teamA: 'أول المجموعة A', teamB: 'ثالث (C/E/F/H/I)', isLocked: false, actualA: null, actualB: null },
  { id: "m80", order: 80, group: 'دور الـ 32', date: '2026-07-01', time: '19:00', teamA: 'أول المجموعة L', teamB: 'ثالث (E/H/I/J/K)', isLocked: false, actualA: null, actualB: null },
  { id: "m81", order: 81, group: 'دور الـ 32', date: '2026-07-02', time: '03:00', teamA: 'أول المجموعة D', teamB: 'ثالث (B/E/F/I/J)', isLocked: false, actualA: null, actualB: null },
  { id: "m82", order: 82, group: 'دور الـ 32', date: '2026-07-01', time: '23:00', teamA: 'أول المجموعة G', teamB: 'ثالث (A/E/H/I/J)', isLocked: false, actualA: null, actualB: null },
  { id: "m83", order: 83, group: 'دور الـ 32', date: '2026-07-03', time: '02:00', teamA: 'ثاني المجموعة K', teamB: 'ثاني المجموعة L', isLocked: false, actualA: null, actualB: null },
  { id: "m84", order: 84, group: 'دور الـ 32', date: '2026-07-02', time: '22:00', teamA: 'أول المجموعة H', teamB: 'ثاني المجموعة J', isLocked: false, actualA: null, actualB: null },
  { id: "m85", order: 85, group: 'دور الـ 32', date: '2026-07-03', time: '06:00', teamA: 'أول المجموعة B', teamB: 'ثالث (E/F/G/I/J)', isLocked: false, actualA: null, actualB: null },
  { id: "m86", order: 86, group: 'دور الـ 32', date: '2026-07-04', time: '01:00', teamA: 'أول المجموعة J', teamB: 'ثاني المجموعة H', isLocked: false, actualA: null, actualB: null },
  { id: "m87", order: 87, group: 'دور الـ 32', date: '2026-07-04', time: '04:30', teamA: 'أول المجموعة K', teamB: 'ثالث (D/E/I/J/L)', isLocked: false, actualA: null, actualB: null },
  { id: "m88", order: 88, group: 'دور الـ 32', date: '2026-07-03', time: '21:00', teamA: 'ثاني المجموعة D', teamB: 'ثاني المجموعة G', isLocked: false, actualA: null, actualB: null },

  // --- دور الـ 16 الإقصائي ---
  { id: "m89", order: 89, group: 'دور الـ 16', date: '2026-07-05', time: '00:00', teamA: 'الفائز من م74', teamB: 'الفائز من م77', isLocked: false, actualA: null, actualB: null },
  { id: "m90", order: 90, group: 'دور الـ 16', date: '2026-07-04', time: '20:00', teamA: 'الفائز من م73', teamB: 'الفائز من م75', isLocked: false, actualA: null, actualB: null },
  { id: "m91", order: 91, group: 'دور الـ 16', date: '2026-07-05', time: '23:00', teamA: 'الفائز من م76', teamB: 'الفائز من م78', isLocked: false, actualA: null, actualB: null },
  { id: "m92", order: 92, group: 'دور الـ 16', date: '2026-07-06', time: '03:00', teamA: 'الفائز من م79', teamB: 'الفائز من م80', isLocked: false, actualA: null, actualB: null },
  { id: "m93", order: 93, group: 'دور الـ 16', date: '2026-07-06', time: '22:00', teamA: 'الفائز من م83', teamB: 'الفائز من م84', isLocked: false, actualA: null, actualB: null },
  { id: "m94", order: 94, group: 'دور الـ 16', date: '2026-07-07', time: '03:00', teamA: 'الفائز من م81', teamB: 'الفائز من م82', isLocked: false, actualA: null, actualB: null },
  { id: "m95", order: 95, group: 'دور الـ 16', date: '2026-07-07', time: '19:00', teamA: 'الفائز من م86', teamB: 'الفائز من م88', isLocked: false, actualA: null, actualB: null },
  { id: "m96", order: 96, group: 'دور الـ 16', date: '2026-07-07', time: '23:00', teamA: 'الفائز من م85', teamB: 'الفائز من م87', isLocked: false, actualA: null, actualB: null },

  // --- دور ربع النهائي ---
  { id: "m97", order: 97, group: 'ربع النهائي', date: '2026-07-09', time: '23:00', teamA: 'الفائز من م89', teamB: 'الفائز من م90', isLocked: false, actualA: null, actualB: null },
  { id: "m98", order: 98, group: 'ربع النهائي', date: '2026-07-10', time: '22:00', teamA: 'الفائز من م93', teamB: 'الفائز من م94', isLocked: false, actualA: null, actualB: null },
  { id: "m99", order: 99, group: 'ربع النهائي', date: '2026-07-12', time: '00:00', teamA: 'الفائز من م91', teamB: 'الفائز من م92', isLocked: false, actualA: null, actualB: null },
  { id: "m100", order: 100, group: 'ربع النهائي', date: '2026-07-12', time: '04:00', teamA: 'الفائز من م95', teamB: 'الفائز من م96', isLocked: false, actualA: null, actualB: null },

  // --- دور نصف النهائي ---
  { id: "m101", order: 101, group: 'نصف النهائي', date: '2026-07-14', time: '22:00', teamA: 'الفائز من م97', teamB: 'الفائز من م98', isLocked: false, actualA: null, actualB: null },
  { id: "m102", order: 102, group: 'نصف النهائي', date: '2026-07-15', time: '22:00', teamA: 'الفائز من م99', teamB: 'الفائز من م100', isLocked: false, actualA: null, actualB: null },

  // --- المركز الثالث والنهائي الكبير ---
  { id: "m103", order: 103, group: 'المركز الثالث', date: '2026-07-18', time: '00:00', teamA: 'خاسر م101', teamB: 'خاسر م102', isLocked: false, actualA: null, actualB: null },
  { id: "m104", order: 104, group: 'النهائي', date: '2026-07-19', time: '22:00', teamA: 'الفائز من م101', teamB: 'الفائز من م102', isLocked: false, actualA: null, actualB: null }
];

const ALL_48_TEAMS = [
  'المكسيك', 'جنوب إفريقيا', 'كوريا الجنوبية', 'تشيكيا', 'كندا', 'البوسنة والهرسك', 'قطر', 'سويسرا',
  'البرازيل', 'المغرب', 'هايتي', 'اسكتلندا', 'الولايات المتحدة', 'باراغواي', 'أستراليا', 'تركيا',
  'ألمانيا', 'كوراساو', 'ساحل العاج', 'الإكوادور', 'هولندا', 'اليابان', 'السويد', 'تونس', 'إسبانيا',
  'الرأس الأخضر', 'بلجيكا', 'مصر', 'السعودية', 'أوروغواي', 'إيران', 'نيوزيلندا', 'فرنسا', 'السنغال',
  'العراق', 'النرويج', 'الأرجنتين', 'الجزائر', 'النمسا', 'الأردن', 'البرتغال', 'جمهورية الكونغو',
  'إنجلترا', 'كرواتيا', 'غانا', 'بنما', 'أوزبكستان', 'كولومبيا'
].sort((a, b) => a.localeCompare(b, 'ar'));

const getBaseCollection = (collectionName) => collection(db, 'artifacts', appId, 'public', 'data', collectionName);
const getBaseDoc = (collectionName, docId) => doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);

// الأمان التلقائي: قفل التوقعات الفردية لكل مباراة فور بدء وقتها الحقيقي بتوقيت البحرين (GMT+3)
const isMatchStarted = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  try {
    const matchDate = new Date(`${dateStr}T${timeStr}:00+03:00`);
    if (isNaN(matchDate)) return false;
    return new Date() >= matchDate;
  } catch (e) { return false; }
};

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [usersData, setUsersData] = useState([]);
  const [dbMatches, setDbMatches] = useState([]); 
  const [predictions, setPredictions] = useState([]);
  const [settings, setSettings] = useState({ actualChampion: null, isRegistrationLocked: false });
  
  const [activeTab, setActiveTab] = useState('matches');
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeProfileId, setActiveProfileId] = useState(localStorage.getItem('wc2026_profile_id_ar') || null);

  useEffect(() => {
    const timer = setInterval(() => {}, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setErrorMsg("فشل الاتصال بقاعدة البيانات. يرجى التحديث.");
        setAuthChecking(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const unUsers = onSnapshot(getBaseCollection('users'), (snapshot) => {
      const uData = [];
      snapshot.forEach(doc => uData.push({ profileId: doc.id, ...doc.data() }));
      setUsersData(uData);
    });

    const unMatches = onSnapshot(getBaseCollection('matches'), (snapshot) => {
      const mData = [];
      snapshot.forEach(doc => mData.push({ id: doc.id, ...doc.data() }));
      setDbMatches(mData);
    });

    const unPreds = onSnapshot(getBaseCollection('predictions'), (snapshot) => {
      const pData = [];
      snapshot.forEach(doc => pData.push({ id: doc.id, ...doc.data() }));
      setPredictions(pData);
    });

    const unSettings = onSnapshot(getBaseDoc('settings', 'global'), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data());
    });

    return () => { unUsers(); unMatches(); unPreds(); unSettings(); };
  }, [firebaseUser]);

  const matches = useMemo(() => {
    return BASE_MATCHES.map(baseMatch => {
      const dbEdit = dbMatches.find(m => m.id === baseMatch.id);
      return dbEdit ? { ...baseMatch, ...dbEdit } : baseMatch;
    });
  }, [dbMatches]);

  const leaderboardData = useMemo(() => {
    return usersData.map(u => {
      let points = 0; let exact = 0; let outcome = 0;
      const userPreds = predictions.filter(p => p.profileId === u.profileId);

      matches.forEach(match => {
        const p = userPreds.find(pred => pred.matchId === match.id);
        if (!p) return;

        const isKnockout = !match.group.includes('دور المجموعات');

        if (isKnockout) {
          // التحقق من وجود نتيجة فعلية وتوقع صحيح التركيب للأدوار الإقصائية
          const hasActual = match.isPk ? !!match.pkWinner : (match.actualA !== null && !isNaN(match.actualA));
          const hasPred = p.isPk ? !!p.pkWinner : (p.scoreA !== '' && p.scoreB !== '' && p.scoreA !== undefined);

          if (hasActual && hasPred) {
            // تحديد الفائز الفعلي والمبرمج
            const actualWinner = match.isPk ? match.pkWinner : (parseInt(match.actualA) > parseInt(match.actualB) ? 'A' : 'B');
            const predWinner = p.isPk ? p.pkWinner : (parseInt(p.scoreA) > parseInt(p.scoreB) ? 'A' : 'B');

            const isActualPk = !!match.isPk;
            const isPredPk = !!p.isPk;

            if (!isActualPk && !isPredPk) {
              // كلاهما توقع مباراة عادية بدون ركلات ترجيح
              const pA = parseInt(p.scoreA); const pB = parseInt(p.scoreB);
              const aA = parseInt(match.actualA); const aB = parseInt(match.actualB);
              if (pA === aA && pB === aB) { points += 3; exact += 1; } 
              else if (actualWinner === predWinner) { points += 1; outcome += 1; }
            } else if (isActualPk && isPredPk) {
              // كلاهما توقع ركلات ترجيح وأصابوا المسار والبطل الفائز
              if (match.pkWinner === p.pkWinner) { points += 3; exact += 1; }
            } else {
              // أحدهما توقع ركلات ترجيح والآخر نتيجة عادية، ولكن أصابوا هوية المتأهل
              if (actualWinner === predWinner) { points += 1; outcome += 1; }
            }
          }
        } else {
          // نظام دور المجموعات العادي (السابق)
          if (match.actualA !== undefined && match.actualA !== null && !isNaN(match.actualA)) {
            if (p.scoreA !== '' && p.scoreB !== '') {
              const pA = parseInt(p.scoreA); const pB = parseInt(p.scoreB);
              const aA = parseInt(match.actualA); const aB = parseInt(match.actualB);
              if (pA === aA && pB === aB) { points += 3; exact += 1; } 
              else if ((pA > pB && aA > aB) || (pA < pB && aA < aB) || (pA === pB && aA === aB)) { points += 1; outcome += 1; }
            }
          }
        }
      });


      if (settings?.actualChampion && u.champion === settings.actualChampion) points += 10;
      return { ...u, points, exact, outcome };
    }).sort((a, b) => b.points - a.points || b.exact - a.exact || b.outcome - a.outcome);
  }, [usersData, matches, predictions, settings]);

  const handleSetProfile = (profileId) => {
    localStorage.setItem('wc2026_profile_id_ar', profileId);
    setActiveProfileId(profileId);
  };

  const handleLogout = () => {
    localStorage.removeItem('wc2026_profile_id_ar');
    setActiveProfileId(null);
  }

  useEffect(() => {
    if (activeProfileId && usersData.length > 0 && !usersData.find(u => u.profileId === activeProfileId)) {
      handleLogout();
    }
  }, [usersData, activeProfileId]);

  if (authChecking) {
    return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-emerald-400 gap-4"><Trophy className="w-12 h-12 animate-bounce"/><p>جاري تحميل التطبيق...</p></div>;
  }

  if (!firebaseUser && errorMsg) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400 p-6 text-center">{errorMsg}</div>;
  }

  const currentProfile = usersData.find(u => u.profileId === activeProfileId);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20 text-right">
      {/* هيدر التطبيق الأصلي مع دمج عبارة الرعاية الكريمة */}
      <header className="bg-slate-800 p-4 shadow-md sticky top-0 z-10 border-b border-slate-700">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
  <div className="flex items-center gap-2 text-emerald-400">
            <Trophy className="w-6 h-6" />
            <div className="flex flex-col text-right">
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">توقعات المونديال 26</h1>
              <span className="text-[10px] text-slate-400 font-medium mt-1">برعاية الحاج عبدالله جناحي</span>
            </div>
          </div>
          {currentProfile && (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              <span className="font-medium text-white">{currentProfile.name}</span>
              <button onClick={handleLogout} className="text-xs mr-2 text-slate-500 hover:text-white underline">خروج</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {!currentProfile ? (
          <AuthForms onLogin={handleSetProfile} existingUsers={usersData} isRegistrationLocked={settings?.isRegistrationLocked} />
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === 'matches' && <MatchesView matches={matches} predictions={predictions} profileId={currentProfile.profileId} />}
            {activeTab === 'predictions' && <PredictionsView matches={matches} predictions={predictions} usersData={usersData} />}
            {activeTab === 'leaderboard' && <LeaderboardView leaderboardData={leaderboardData} settings={settings} />}
            
            {/* حماية العرض: الصفحة لا تفتح إلا للمدراء المعتمدين */}
            {activeTab === 'admin' && ADMIN_USERS.includes(currentProfile.name) && (
              <AdminView isAdmin={isAdmin} setIsAdmin={setIsAdmin} matches={matches} settings={settings} passcode={ADMIN_PASSCODE} usersData={usersData} predictions={predictions} />
            )}
          </div>
        )}
      </main>



      {currentProfile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 pb-safe z-20">
        <div className="max-w-4xl mx-auto flex justify-around">
          <NavBtn icon={<CalendarDays className="w-6 h-6" />} label="المباريات" active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} />
          <NavBtn icon={<Eye className="w-6 h-6" />} label="التوقعات" active={activeTab === 'predictions'} onClick={() => setActiveTab('predictions')} />
          <NavBtn icon={<BarChart3 className="w-6 h-6" />} label="الترتيب" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
          
          {/* لن يظهر هذا الزر إلا لإبراهيم وحمد */}
          {ADMIN_USERS.includes(currentProfile.name) && (
            <NavBtn icon={<Settings className="w-6 h-6" />} label="الإدارة" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          )}
        </div>
      </nav>

      )}
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function AuthForms({ onLogin, existingUsers, isRegistrationLocked }) {
  const [mode, setMode] = useState(isRegistrationLocked ? 'login' : 'register');
  const [name, setName] = useState('');
  const [champion, setChampion] = useState('');
  const [pin, setPin] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isRegistrationLocked) return;
    if (!name.trim() || !champion.trim() || pin.length !== 4) {
      setError('يرجى تعبئة جميع الحقول وإدخال رمز PIN من 4 أرقام.'); return;
    }
    if (existingUsers.some(u => u.name.trim() === name.trim())) {
      setError('هذا الاسم مستخدم مسبقاً. أضف اسم العائلة أو انتقل لصفحة الدخول.'); return;
    }

    setLoading(true); setError('');
    const newProfileId = 'user_' + Date.now().toString(); 

    try {
      await setDoc(getBaseDoc('users', newProfileId), { 
        name: name.trim(), champion: champion.trim(), pin: pin, joinedAt: new Date().toISOString() 
      });
      onLogin(newProfileId);
    } catch (err) { 
      console.error(err); setError("حدث خطأ أثناء إنشاء الحساب.");
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!selectedProfileId || loginPin.length !== 4) {
       setError('اختر اسمك وأدخل الرمز السري من 4 أرقام.'); return;
    }

    const user = existingUsers.find(u => u.profileId === selectedProfileId);
    if (user && user.pin === loginPin) {
      onLogin(user.profileId);
    } else {
      setError('الرمز السري خاطئ لهذا الحساب.');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 text-right">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">بوابة المسابقة</h2>
      </div>

      <div className="flex bg-slate-900 rounded-lg p-1 mb-6 border border-slate-700 flex-row-reverse">
        <button onClick={() => {setMode('register'); setError('');}} className={`flex-1 py-2 rounded flex justify-center items-center gap-2 text-sm font-bold transition-colors ${mode === 'register' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>
          <UserPlus className="w-4 h-4"/> لاعب جديد
        </button>
        <button onClick={() => {setMode('login'); setError('');}} className={`flex-1 py-2 rounded flex justify-center items-center gap-2 text-sm font-bold transition-colors ${mode === 'login' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>
          <LogIn className="w-4 h-4"/> تسجيل دخول
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

      {mode === 'register' ? (
        isRegistrationLocked ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-4 rounded-lg text-center text-sm flex flex-col items-center gap-2">
            <ShieldAlert className="w-6 h-6"/>
            التسجيل مغلق حالياً من قبل الإدارة.
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">الاسم الكامل</label>
              <input type="text" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-right" placeholder="مثال: حمد خالد" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">توقع البطل (10 نقاط)</label>
              <select required value={champion} onChange={(e) => setChampion(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none text-right">
                <option value="" disabled>اختر فريقاً...</option>
                {ALL_48_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">أنشئ رمز PIN (4 أرقام)</label>
              <input type="password" required maxLength={4} pattern="\d{4}" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-center tracking-widest text-lg" placeholder="1234" />
              <p className="text-xs text-slate-500 mt-1 text-right">* تذكر هذا الرمز لتسجيل الدخول لاحقاً من أجهزة أخرى.</p>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-lg px-4 py-3 mt-4 transition">
              {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">اختر اسمك</label>
            <select required value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none text-right">
              <option value="" disabled>ابحث عن اسمك...</option>
              {existingUsers.map(u => <option key={u.profileId} value={u.profileId}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">أدخل رمز PIN الخاص بك</label>
            <input type="password" required maxLength={4} value={loginPin} onChange={(e) => setLoginPin(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-center tracking-widest text-lg" placeholder="••••" />
          </div>
          <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg px-4 py-3 mt-4 transition">
            دخول اللوحة
          </button>
        </form>
      )}
    </div>
  );
}
function MatchesView({ matches, predictions, profileId }) {
  // 1. تحديد حالة الفلتر الحالي (الافتراضي هو 'upcoming' لإظهار الكل عند فتح التطبيق)
  const [filterType, setFilterType] = useState('upcoming');

  // 2. معالجة وتصفية المباريات ديناميكياً حسب الفلتر المختار
  const filteredMatches = useMemo(() => {
    const now = new Date();
    const localTodayStr = now.toLocaleDateString('en-CA'); // تنسيق مستقر وموحد ميلادياً "YYYY-MM-DD"
    
    return matches.filter(match => {
      if (filterType === 'today') {
        // فلتر مباريات اليوم
        return match.date === localTodayStr;
      }
      
      if (filterType === 'upcoming') {
        // فلتر إخفاء المنتهية: دمج تاريخ المباراة ووقتها ومقارنتها بالوقت الحالي بالثانية لقفلها فوراً
        try {
          const matchDateTime = new Date(`${match.date}T${match.time}:00+03:00`);
          return matchDateTime > now;
        } catch (e) {
          return true; 
        }
      }
      
      // الافتراضي: إظهار الكل 'all'
      return true;
    });
  }, [matches, filterType]);

  // 3. إعادة تقسيم المباريات المفلترة بناءً على التاريخ لعرض العناوين
  const matchesByDate = filteredMatches.reduce((acc, match) => {
    const d = match.date || "غير محدد";
    if (!acc[d]) acc[d] = [];
    acc[d].push(match);
    return acc;
  }, {});

  const sortedDates = Object.keys(matchesByDate).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-300">
      
      {/* قسم العناوين والوصف */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 flex-row-reverse">
        <div className="text-right">
          <h2 className="text-xl font-bold text-white">توقعات المباريات</h2>
          <p className="text-xs text-slate-400">عرض مباريات البطولة الـ 104 بالتفصيل</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs flex items-center gap-1 bg-slate-800 text-emerald-400 px-3 py-1.5 rounded-full border border-slate-700">
            <Clock className="w-3 h-3"/> بتوقيت البحرين (GMT+3)
          </span>
        </div>
      </div>

      {/* شريط الفلاتر الثلاثة في أعلى صفحة المباريات */}
      <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 flex flex-row-reverse gap-1 max-w-md ml-auto">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
            filterType === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          إظهار الكل
        </button>
        
        <button
          onClick={() => setFilterType('today')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
            filterType === 'today'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          مباريات اليوم
        </button>
        
        <button
          onClick={() => setFilterType('upcoming')}
          className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
            filterType === 'upcoming'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          إخفاء المنتهية
        </button>
      </div>

      {/* عرض التواريخ والمباريات المفلترة */}
      {sortedDates.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center text-slate-400 shadow-md">
          <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-bold text-white">لا توجد مباريات تطابق هذا الفلتر حالياً</p>
          <p className="text-xs text-slate-500 mt-1">اضغط على زر "إظهار الكل" لمراجعة بقية لقاءات البطولة.</p>
        </div>
      ) : (
        sortedDates.map(date => {
          let displayDate = date;
          try {
            const dObj = new Date(date);
            if (!isNaN(dObj)) {
              displayDate = new Intl.DateTimeFormat('ar-BH', { 
                calendar: 'gregory',
                numberingSystem: 'latn',
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              }).format(dObj);
            }
          } catch(e) {}

          return (
            <div key={date} className="space-y-3 text-right">
              <h3 className="text-sm font-bold text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg inline-block border border-slate-700/50">
                {displayDate}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {matchesByDate[date].map(match => {
                  const pred = predictions.find(p => p.matchId === match.id && p.profileId === profileId);
                  return <MatchCard key={match.id} match={match} userPred={pred} profileId={profileId} />;
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}


function MatchCard({ match, userPred, profileId }) {
  const [scoreA, setScoreA] = useState(userPred?.scoreA ?? '');
  const [scoreB, setScoreB] = useState(userPred?.scoreB ?? '');
  const [isPk, setIsPk] = useState(userPred?.isPk ?? false);
  const [pkWinner, setPkWinner] = useState(userPred?.pkWinner ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isKnockout = !match.group.includes('دور المجموعات');

  useEffect(() => {
    setScoreA(userPred?.scoreA ?? '');
    setScoreB(userPred?.scoreB ?? '');
    setIsPk(userPred?.isPk ?? false);
    setPkWinner(userPred?.pkWinner ?? '');
  }, [userPred]);

  // إضافة (??) للتحقق من القيم الفارغة لركلات الترجيح لمنع إضاءة زر الحفظ بشكل خاطئ
  const hasChanges = isKnockout 
    ? ((userPred?.isPk ?? false) !== isPk || (userPred?.pkWinner ?? '') !== pkWinner || (userPred?.scoreA ?? '') !== scoreA || (userPred?.scoreB ?? '') !== scoreB)
    : ((userPred?.scoreA ?? '') !== scoreA || (userPred?.scoreB ?? '') !== scoreB);

  const handleSave = async () => {
    if (isKnockout) {
      if (!isPk && (scoreA === '' || scoreB === '')) return;
      if (!isPk && parseInt(scoreA) === parseInt(scoreB)) {
        alert("لا يسمح بنتيجة التعادل في الأدوار الإقصائية! يجب تحديد فريق فائز أو تفعيل ركلات الترجيح.");
        return;
      }
      if (isPk && !pkWinner) {
        alert("الرجاء اختيار الفريق الفائز بركلات الترجيح قبل الحفظ.");
        return;
      }
    } else {
      if (scoreA === '' || scoreB === '') return;
    }

    setSaving(true);
    const predId = `${profileId}_${match.id}`;
    try {
      await setDoc(getBaseDoc('predictions', predId), { 
        profileId, 
        matchId: match.id, 
        scoreA: isPk ? null : (scoreA !== '' ? parseInt(scoreA) : ''), 
        scoreB: isPk ? null : (scoreB !== '' ? parseInt(scoreB) : ''),
        isPk: isKnockout ? isPk : false,
        pkWinner: (isKnockout && isPk) ? pkWinner : null
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const isCompleted = match.actualA !== null && match.actualA !== undefined && !isNaN(match.actualA);
  const isPastKickoff = isMatchStarted(match.date, match.time);
  const isLockedForUser = match.isLocked || isCompleted || isPastKickoff;

  let earnedPoints = null;
  if (isCompleted && userPred) {
    if (!match.isPk && !userPred.isPk) {
      // 1. كلاهما توقع مباراة عادية (ينطبق بشكل أساسي على دور المجموعات)
      const pA = parseInt(userPred.scoreA); const pB = parseInt(userPred.scoreB);
      const aA = parseInt(match.actualA); const aB = parseInt(match.actualB);
      
      if (pA === aA && pB === aB) earnedPoints = 3;
      else if ((pA > pB && aA > aB) || (pA < pB && aA < aB) || (pA === pB && aA === aB)) earnedPoints = 1;
      else earnedPoints = 0;
    } else if (match.isPk && userPred.isPk) {
      // 2. كلاهما توقع ركلات ترجيح
      if (match.pkWinner === userPred.pkWinner) earnedPoints = 3;
      else earnedPoints = 0;
    } else {
      // 3. أحدهما توقع ركلات ترجيح والآخر نتيجة عادية (في الأدوار الإقصائية)
      const actualWinner = match.isPk ? match.pkWinner : (parseInt(match.actualA) > parseInt(match.actualB) ? 'A' : 'B');
      const predWinner = userPred.isPk ? userPred.pkWinner : (parseInt(userPred.scoreA) > parseInt(userPred.scoreB) ? 'A' : 'B');
      
      if (actualWinner === predWinner) earnedPoints = 1;
      else earnedPoints = 0;
    }
  }


  return (
    <div className={`bg-slate-800 rounded-xl p-4 shadow-sm border text-right ${isCompleted ? 'border-slate-600/50 opacity-80' : 'border-slate-700'}`}>
      <div className="flex justify-between items-center text-xs text-slate-400 mb-3 font-medium">
        <span>{match.group} (م{match.order})</span>
        <span className="font-mono">{match.time}</span>
      </div>

      {isKnockout && !isCompleted && (
        <label className="flex items-center gap-2 mb-3 bg-slate-900/50 p-2 rounded-lg cursor-pointer border border-slate-700/50 select-none w-fit mr-auto">
          <input type="checkbox" checked={isPk} disabled={isLockedForUser} onChange={(e) => { setIsPk(e.target.checked); if(!e.target.checked) setPkWinner(''); }} className="accent-emerald-500 rounded" />
          <span className="text-xs text-slate-300">حسم بركلات الترجيح</span>
        </label>
      )}

      {isPk ? (
        <div className="bg-slate-900/60 p-3 rounded-lg border border-emerald-500/20 text-center my-2">
          <p className="text-xs text-slate-400 mb-2">اختر الفريق المتأهل بركلات الترجيح:</p>
          <div className="flex justify-center gap-3">
            <button disabled={isLockedForUser} onClick={() => setPkWinner('A')} className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition ${pkWinner === 'A' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>{match.teamA}</button>
            <button disabled={isLockedForUser} onClick={() => setPkWinner('B')} className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition ${pkWinner === 'B' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}>{match.teamB}</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 text-center min-w-0">
            <div className="font-bold text-sm sm:text-base text-white mb-2 truncate px-1">{match.teamA}</div>
            <input type="number" min="0" max="20" value={scoreA} onChange={(e) => setScoreA(e.target.value)} disabled={isLockedForUser} className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border border-slate-600 rounded-lg text-center text-xl sm:text-2xl font-bold text-white disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="px-1 text-slate-500 font-bold mt-8 text-sm shrink-0">ضد</div>
          <div className="flex-1 text-center min-w-0">
            <div className="font-bold text-sm sm:text-base text-white mb-2 truncate px-1">{match.teamB}</div>
            <input type="number" min="0" max="20" value={scoreB} onChange={(e) => setScoreB(e.target.value)} disabled={isLockedForUser} className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border border-slate-600 rounded-lg text-center text-xl sm:text-2xl font-bold text-white disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center h-10">
        {isCompleted ? (
          <div className="w-full flex justify-between items-center">
            {/* القسم الأيمن: النقاط */}
            <div>
              {earnedPoints !== null && (
                <span className={`text-sm font-bold px-2 py-1 rounded ${earnedPoints === 3 ? 'bg-emerald-500/20 text-emerald-400' : earnedPoints === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                  +{earnedPoints} نقطة
                </span>
              )}
            </div>

            {/* القسم الأيسر: النتيجة النهائية */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400">النتيجة:</span>
              {match.isPk ? (
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-bold">ركلات ترجيح (فاز {match.pkWinner === 'A' ? match.teamA : match.teamB})</span>
              ) : (
                <div className="flex items-center gap-1.5 text-white font-bold" dir="ltr">
                  <span className="w-4 text-center">{match.actualB}</span>
                  <span className="text-slate-500">-</span>
                  <span className="w-4 text-center">{match.actualA}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-between items-center">
             {/* القسم الأيمن: زر الحفظ */}
             <div>
               {!isLockedForUser && (
                 <button onClick={handleSave} disabled={saving || !hasChanges} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition ${saved ? 'bg-emerald-500/20 text-emerald-400' : hasChanges ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>
                   {saving ? 'جاري الحفظ...' : saved ? <><Check className="w-4 h-4"/> تم الحفظ</> : <><Save className="w-4 h-4"/> حفظ</>}
                 </button>
               )}
             </div>

             {/* القسم الأيسر: حالة المباراة */}
             <div>
               {(match.isLocked || isPastKickoff) ? (
                 <span className="text-sm text-yellow-500 flex items-center gap-1"><Lock className="w-4 h-4"/> مغلق</span>
               ) : (
                 <span className="text-xs text-slate-500">بانتظار البداية</span>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}



function LeaderboardView({ leaderboardData, settings }) {
  return (
    <div className="space-y-4 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 flex-row-reverse">
        <h2 className="text-xl font-bold text-white">الترتيب المباشر</h2>
        <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          نقاط: تامة (3) • النتيجة (1) • البطل (10)
        </div>
      </div>

      {settings?.actualChampion && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg mb-4 flex items-center justify-between flex-row-reverse">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <div className="text-right">
            <p className="text-sm text-yellow-500/80 font-medium">بطل البطولة الرسمي</p>
            <p className="text-lg text-yellow-500 font-bold">{settings.actualChampion}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
        <div className="grid grid-cols-12 gap-2 p-3 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-800/50 flex-row-reverse">
          <div className="col-span-2 text-center">المركز</div>
          <div className="col-span-5 text-right">اللاعب</div>
          <div className="col-span-3 text-center" title="نتيجة تامة / فائز صحيح">تام/فائز</div>
          <div className="col-span-2 text-center">نقاط</div>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {leaderboardData.length === 0 ? (
            <div className="p-8 text-center text-slate-500">لا يوجد مشاركين بعد.</div>
          ) : (
            leaderboardData.map((user, index) => {
              const rank = index + 1;
              let styleStr = "bg-slate-800";
              let rankStyle = "text-slate-400 font-bold";
              
              if (rank === 1) { styleStr = "bg-yellow-500/10"; rankStyle = "text-yellow-400 font-black text-lg"; }
              else if (rank === 2) { styleStr = "bg-slate-300/10"; rankStyle = "text-slate-300 font-black text-lg"; }
              else if (rank === 3) { styleStr = "bg-amber-700/10"; rankStyle = "text-amber-500 font-black text-lg"; }

              return (
                <div key={user.profileId} className={`grid grid-cols-12 gap-2 p-3 items-center transition flex-row-reverse ${styleStr}`}>
                  <div className={`col-span-2 text-center ${rankStyle}`}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}</div>
                  <div className="col-span-5 text-right min-w-0">
                    <div className="font-bold text-white truncate text-sm text-right" title={user.name}>{user.name}</div>
                    <div className="text-xs text-slate-400 truncate text-right">🏆 {user.champion}</div>
                  </div>
                  <div className="col-span-3 text-center flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      <span className="text-emerald-400">{user.exact}</span> / <span className="text-blue-400">{user.outcome}</span>
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-black text-emerald-400 text-lg">{user.points}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AdminView({ isAdmin, setIsAdmin, matches, settings, passcode, usersData, predictions }) {
  const [inputCode, setInputCode] = useState('');
  const [actualChamp, setActualChamp] = useState(settings?.actualChampion || '');
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editForm, setEditForm] = useState({ teamA: '', teamB: '', date: '', time: '', group: '' });
  
  // 1. إضافة حالة الفلتر الجديد (الوضع الافتراضي: إخفاء المنتهية)
  const [matchFilter, setMatchFilter] = useState('hide_completed');

  // دالة استخراج توقعات المباريات المنقضية إلى إكسل
  const exportToExcel = () => {
    const pastMatches = matches.filter(m => m.actualA !== null && m.actualA !== undefined && !isNaN(m.actualA));

    if (pastMatches.length === 0) {
      alert("لا توجد مباريات منقضية (مكتملة النتائج) لاستخراجها حالياً.");
      return;
    }

    const headers = ['رقم المباراة', 'وصف المباراة', 'تاريخ المباراة', 'وقت المباراة', 'فريق 1', 'فريق 2', 'نتيجة ف1', 'نتيجة ف2'];
    
    usersData.forEach(user => {
      headers.push(`${user.name} (ف1)`);
      headers.push(`${user.name} (ف2)`);
      headers.push(`${user.name} (النقاط)`);
    });

    const rows = [];
    pastMatches.forEach(match => {
      const row = [
        match.order,
        match.group,
        match.date,
        match.time,
        match.teamA,
        match.teamB,
        match.actualA,
        match.actualB
      ];

      usersData.forEach(user => {
        const pred = predictions.find(p => p.matchId === match.id && p.profileId === user.profileId);
        
        if (pred) {
          if (pred.isPk) {
            const winnerName = pred.pkWinner === 'A' ? match.teamA : match.teamB;
            row.push('ترجيح', winnerName, (match.isPk && match.pkWinner === pred.pkWinner) ? 3 : ( (!match.isPk && ((parseInt(match.actualA) > parseInt(match.actualB) && pred.pkWinner === 'A') || (parseInt(match.actualB) > parseInt(match.actualA) && pred.pkWinner === 'B'))) ? 1 : 0 ));
          } else if (pred.scoreA !== '' && pred.scoreB !== '' && pred.scoreA !== undefined) {
            // توقع المشارك كان بأهداف عادية
            const pA = parseInt(pred.scoreA); const pB = parseInt(pred.scoreB);
            const aA = parseInt(match.actualA); const aB = parseInt(match.actualB);
            
            let points = 0;
            if (!match.isPk) {
              // المباراة انتهت بأهداف عادية
              if (pA === aA && pB === aB) points = 3;
              else if ((pA > pB && aA > aB) || (pA < pB && aA < aB) || (pA === pB && aA === aB)) points = 1;
            } else {
              // المباراة انتهت بركلات ترجيح ولكن توقع المشارك كان بأهداف عادية
              const predWinner = pA > pB ? 'A' : (pA < pB ? 'B' : 'D');
              if (match.pkWinner === predWinner) points = 1;
            }

            row.push(pA, pB, points);
          } else {
            row.push('-', '-', 0);
          }
        } else {
          row.push('-', '-', 0);
        }
      });
      rows.push(row);
    });

    if (settings && settings.actualChampion) {
      const champRow = [
        '', 'بطل كأس العالم 2026', '', '', '', '', settings.actualChampion, ''
      ];

      usersData.forEach(user => {
        let champPoints = 0;
        if (user.champion1 === settings.actualChampion) champPoints = 10;
        else if (user.champion2 === settings.actualChampion) champPoints = 7;
        else if (user.champion3 === settings.actualChampion) champPoints = 5;

        const userChoices = `${user.champion1} / ${user.champion2} / ${user.champion3}`;
        champRow.push(userChoices);  
        champRow.push('');           
        champRow.push(champPoints);  
      });

      rows.push(champRow);
    }

    const csvContent = '\uFEFF' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'توقعات_المباريات_المنقضية.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputCode === passcode) setIsAdmin(true);
    else alert("رمز المرور غير صحيح.");
  };

  const updateMatchSafely = async (matchId, updates) => {
    try {
      await setDoc(getBaseDoc('matches', matchId), updates, { merge: true });
    } catch (err) { console.error(err); alert("فشل في حفظ التعديلات."); }
  };

  const handleSetScores = (matchId, sA, sB) => {
    const cleanA = (sA === '' || sA === null || isNaN(parseInt(sA))) ? null : parseInt(sA);
    const cleanB = (sB === '' || sB === null || isNaN(parseInt(sB))) ? null : parseInt(sB);
    updateMatchSafely(matchId, { actualA: cleanA, actualB: cleanB });
  };

  const handleSetChampion = async () => {
    try { await setDoc(getBaseDoc('settings', 'global'), { actualChampion: actualChamp || null }, { merge: true }); }
    catch (err) { console.error(err); }
  };

  const handleToggleLock = (matchId, currentLock) => updateMatchSafely(matchId, { isLocked: !currentLock });

  const toggleRegistration = async () => {
    try {
      await setDoc(getBaseDoc('settings', 'global'), { isRegistrationLocked: !settings?.isRegistrationLocked }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (profileId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً مع جميع توقعاته؟")) {
      try {
        await deleteDoc(getBaseDoc('users', profileId));
        const userPreds = predictions.filter(p => p.profileId === profileId);
        const batch = writeBatch(db);
        userPreds.forEach(p => { batch.delete(getBaseDoc('predictions', p.id)); });
        await batch.commit();
      } catch (err) { console.error(err); alert("حدث خطأ أثناء الحذف."); }
    }
  };

  const openEditForm = (match) => {
    setEditingMatchId(match.id);
    setEditForm({ teamA: match.teamA, teamB: match.teamB, date: match.date, time: match.time, group: match.group });
  };

  const saveEditForm = async () => {
    await updateMatchSafely(editingMatchId, { ...editForm });
    setEditingMatchId(null);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto mt-10 bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 text-center">
        <Lock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">لوحة الإدارة</h2>
        <p className="text-sm text-slate-400 mb-6">أدخل رمز المرور السري لإدارة التطبيق.</p>
        <form onSubmit={handleLogin}>
          <input type="password" value={inputCode} onChange={e => setInputCode(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-center text-xl tracking-widest text-white focus:ring-2 focus:ring-emerald-500 outline-none mb-4" placeholder="••••" />
          <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg px-4 py-3 transition">دخول</button>
        </form>
      </div>
    );
  }

  // 2. تصفية المباريات المعروضة في الإدارة بناءً على الفلتر
  const displayedMatches = matches.filter(match => {
    if (matchFilter === 'hide_completed') {
      // إخفاء المباراة إذا كانت: (مغلقة) و (يوجد لها نتيجة فعلية مسجلة أو نتيجة ركلات ترجيح)
      const hasResult = match.isPk ? !!match.pkWinner : (match.actualA !== null && match.actualA !== undefined && !isNaN(match.actualA));
      return !(match.isLocked && hasResult);
    }
    return true; // في حال اختيار "إظهار الكل"
  });

  return (
    <div className="space-y-6 mb-20 text-right" dir="rtl">
      <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-400"/> لوحة تحكم الإدارة</h2>
        <button onClick={() => setIsAdmin(false)} className="text-sm text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded">خروج</button>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md flex justify-between items-center">
        <div>
          <h3 className="font-bold text-white text-sm">تسجيل المشتركين الجدد</h3>
          <p className="text-xs text-slate-400 mt-1">قم بإغلاق أو فتح باب التسجيل في التطبيق.</p>
        </div>
        <button onClick={toggleRegistration} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${settings?.isRegistrationLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
          {settings?.isRegistrationLocked ? 'مغلق (افتح التسجيل)' : 'مفتوح (أغلق التسجيل)'}
        </button>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <h3 className="font-bold text-white mb-3 text-sm">إدارة المستخدمين</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pl-2">
          {usersData.map(u => (
            <div key={u.profileId} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
              <div>
                <div className="text-sm font-bold text-white truncate">{u.name}</div>
                <div className="text-xs text-slate-400 font-mono">الرقم السري: {u.pin}</div>
              </div>
              <button onClick={() => handleDeleteUser(u.profileId)} className="text-slate-500 hover:text-red-400 p-2 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {usersData.length === 0 && <div className="text-xs text-slate-500 text-center">لا يوجد مشاركين حتى الآن.</div>}
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <h3 className="font-bold text-white mb-3 text-sm">تحديد بطل كأس العالم (لإضافة النقاط)</h3>
        <div className="flex gap-2">
          <select value={actualChamp} onChange={(e) => setActualChamp(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none">
            <option value="">لم يُحدد بعد</option>
            {ALL_48_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleSetChampion} className="bg-emerald-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-400">حفظ البطل</button>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md flex justify-between items-center">
        <div>
          <h3 className="font-bold text-white text-sm">استخراج التوقعات (ملف CSV)</h3>
          <p className="text-xs text-slate-400 mt-1">تحميل ملف يحتوي على جميع التوقعات والنتائج للمباريات المنقضية.</p>
        </div>
        <button onClick={exportToExcel} className="flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-500 hover:text-white transition-colors">
          <Download className="w-4 h-4" />
          تحميل الملف
        </button>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md space-y-4">
        {/* 3. واجهة أزرار الفلتر الجديدة */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-700/50 pb-3">
          <div>
            <h3 className="font-bold text-white text-sm">إدارة وأرشفة الـ 104 مباراة</h3>
            <p className="text-xs text-slate-400 mt-1">تعديل أطراف المباريات أو إدخال النتائج الرسمية.</p>
          </div>
          
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex gap-1 self-start sm:self-auto w-full sm:w-auto">
            <button 
              onClick={() => setMatchFilter('show_all')} 
              className={`flex-1 text-center py-1.5 px-3 rounded text-[11px] font-bold transition-all duration-200 ${matchFilter === 'show_all' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              إظهار الكل
            </button>
            <button 
              onClick={() => setMatchFilter('hide_completed')} 
              className={`flex-1 text-center py-1.5 px-3 rounded text-[11px] font-bold transition-all duration-200 ${matchFilter === 'hide_completed' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              إخفاء المنتهية
            </button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto pl-2">
          {displayedMatches.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">لا توجد مباريات لعرضها في هذا الفلتر.</div>
          ) : (
            displayedMatches.map(match => (
            <div key={match.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-slate-400 font-mono mb-1">{match.date} • {match.time} • {match.group} (م{match.order})</div>
                  <div className="text-sm font-bold text-white truncate">{match.teamA} <span className="text-slate-500">ضد</span> {match.teamB}</div>
                </div>
                <button onClick={() => openEditForm(match)} className="text-slate-400 hover:text-emerald-400 p-1 bg-slate-800 rounded transition-colors mr-2">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {editingMatchId === match.id && (
                <div className="bg-slate-800 p-3 rounded border border-emerald-500/30 mt-2">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div><label className="text-xs text-slate-400">الفريق الأول</label><input type="text" value={editForm.teamA} onChange={e => setEditForm({...editForm, teamA: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                    <div><label className="text-xs text-slate-400">الفريق الثاني</label><input type="text" value={editForm.teamB} onChange={e => setEditForm({...editForm, teamB: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                    <div><label className="text-xs text-slate-400">التاريخ</label><input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                    <div><label className="text-xs text-slate-400">الوقت</label><input type="time" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                    <div className="col-span-2"><label className="text-xs text-slate-400">مرحلة / دور المباراة</label><input type="text" value={editForm.group} onChange={e => setEditForm({...editForm, group: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingMatchId(null)} className="px-3 py-1.5 text-xs text-slate-400 bg-slate-900 rounded">إلغاء</button>
                    <button onClick={saveEditForm} className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-emerald-500 rounded">حفظ التعديل</button>
                  </div>
                </div>
              )}
              
              {!editingMatchId && (
                <div className="flex flex-col gap-2 border-t border-slate-800 pt-2 mt-1">
                  
                  {!match.group.includes('دور المجموعات') && (
                    <div className="flex items-center justify-between bg-slate-950/40 p-1.5 rounded border border-slate-800">
                      <button onClick={() => updateMatchSafely(match.id, { isPk: !match.isPk, actualA: null, actualB: null, pkWinner: null })} className={`text-[10px] px-2 py-1 rounded font-bold border transition-colors ${match.isPk ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                        {match.isPk ? '✓ تم تفعيل ركلات الترجيح' : 'تحويل إلى ركلات ترجيح'}
                      </button>

                      {match.isPk && (
                        <div className="flex gap-1.5">
                          <button onClick={() => updateMatchSafely(match.id, { pkWinner: 'A' })} className={`text-[10px] px-2 py-0.5 rounded ${match.pkWinner === 'A' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>فوز {match.teamA}</button>
                          <button onClick={() => updateMatchSafely(match.id, { pkWinner: 'B' })} className={`text-[10px] px-2 py-0.5 rounded ${match.pkWinner === 'B' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>فوز {match.teamB}</button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between" dir="rtl">
                    {match.isPk ? (
                      <span className="text-xs font-bold text-emerald-400">انتهت بركلات الترجيح بنجاح</span>
                    ) : (
                      <div className="flex items-center gap-2" dir="ltr">
                        <input type="number" placeholder="ب" value={match.actualB ?? ''} onChange={(e) => handleSetScores(match.id, match.actualA, e.target.value)} className="w-12 h-9 bg-slate-800 border border-slate-600 rounded text-center font-bold text-white text-sm" />
                        <span className="text-slate-500">-</span>
                        <input type="number" placeholder="أ" value={match.actualA ?? ''} onChange={(e) => handleSetScores(match.id, e.target.value, match.actualB)} className="w-12 h-9 bg-slate-800 border border-slate-600 rounded text-center font-bold text-white text-sm" />
                      </div>
                    )}

                    <button onClick={() => handleToggleLock(match.id, match.isLocked)} className={`text-xs px-2 py-1.5 rounded w-16 font-medium transition-colors ${match.isLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400 border border-slate-600'}`}>
                      {match.isLocked ? 'مغلق' : 'مفتوح'}
                    </button>
                  </div>

                </div>
              )}
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PredictionsView({ matches, predictions, usersData }) {
  // حالة (State) لحفظ المباراة المختارة من القائمة
  const [selectedMatchId, setSelectedMatchId] = useState('');
  
  const now = new Date();
  
  // 1. تصفية المباريات التي بدأت خلال آخر 12 ساعة
  const recentMatches = matches.filter(match => {
    if (!match.date || !match.time) return false;
    try {
      const matchDate = new Date(`${match.date}T${match.time}:00+03:00`);
      if (isNaN(matchDate)) return false;
      
      // تغيير المدة لتصبح 12 ساعة بدلاً من ساعتين
      const twelveHoursLater = new Date(matchDate.getTime() + (12 * 60 * 60 * 1000));
      return now >= matchDate && now <= twelveHoursLater;
    } catch (e) { return false; }
  }).sort((a, b) => {
    // 2. الترتيب من الأحدث (المباراة التي بدأت مؤخراً) إلى الأقدم
    const dateA = new Date(`${a.date}T${a.time}:00+03:00`).getTime();
    const dateB = new Date(`${b.date}T${b.time}:00+03:00`).getTime();
    return dateB - dateA; 
  });

  // 3. اختيار أحدث مباراة بشكل افتراضي عند تحميل الصفحة
  useEffect(() => {
    if (recentMatches.length > 0) {
      if (!selectedMatchId || !recentMatches.find(m => m.id === selectedMatchId)) {
        setSelectedMatchId(recentMatches[0].id);
      }
    }
  }, [recentMatches, selectedMatchId]);

  // في حال لم تكن هناك أي مباريات ضمن نطاق الـ 12 ساعة
  if (recentMatches.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center text-slate-400 shadow-md">
        <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-base font-bold text-white">لا توجد مباريات بدأت خلال الـ 12 ساعة الماضية</p>
        <p className="text-xs text-slate-500 mt-1">ستظهر توقعات جميع المشاركين هنا للمباريات الجارية والمنتهية حديثاً لضمان الشفافية.</p>
      </div>
    );
  }

  // المباراة التي سيتم عرض جدولها حالياً
  const selectedMatch = recentMatches.find(m => m.id === selectedMatchId) || recentMatches[0];
  
  let displayDate = selectedMatch.date;
  try {
    const dObj = new Date(selectedMatch.date);
    if (!isNaN(dObj)) {
      displayDate = new Intl.DateTimeFormat('ar-BH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(dObj);
    }
  } catch(e) {}

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">شفافية التوقعات</h2>
        <p className="text-xs text-slate-400">يمكنك هنا رؤية توقعات الجميع للمباريات التي بدأت خلال آخر 12 ساعة.</p>
      </div>

      {/* 4. القائمة المنسدلة لاختيار المباراة */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <label className="block text-sm font-bold text-slate-400 mb-2">اختر المباراة لمشاهدة التوقعات:</label>
        <select 
          value={selectedMatchId} 
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-white outline-none focus:border-emerald-500 text-sm font-bold cursor-pointer"
        >
          {recentMatches.map(m => (
            <option key={m.id} value={m.id}>
              {m.teamA} ضد {m.teamB}
            </option>
          ))}
        </select>
      </div>
      
      {/* 5. جدول المباراة المختارة فقط */}
      {selectedMatch && (
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 mb-6">
          <div className="bg-slate-900 p-4 border-b border-slate-700 text-center">
            <p className="text-xs text-emerald-400 font-mono mb-1">{displayDate} - {selectedMatch.time} • {selectedMatch.group}</p>
            <h3 className="text-lg font-bold text-white">{selectedMatch.teamA} ضد {selectedMatch.teamB}</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead className="bg-slate-800/50 text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3 text-right">اسم المشارك</th>
                  <th className="p-3 text-center">{selectedMatch.teamA}</th>
                  <th className="p-3 text-center">{selectedMatch.teamB}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-white">
                {usersData.map(user => {
                  const pred = predictions.find(p => p.profileId === user.profileId && p.matchId === selectedMatch.id);
                  
                  let displayA = '-';
                  let displayB = '-';
                  let isPkText = false;

                  if (pred) {
                    if (pred.isPk) {
                      isPkText = true;
                      displayA = pred.pkWinner === 'A' ? 'متأهل (ترجيح)' : 'خسارة';
                      displayB = pred.pkWinner === 'B' ? 'متأهل (ترجيح)' : 'خسارة';
                    } else if (pred.scoreA !== '' && pred.scoreB !== '' && pred.scoreA !== undefined) {
                      displayA = pred.scoreA;
                      displayB = pred.scoreB;
                    }
                  }
                  
                  return (
                    <tr key={user.profileId} className="hover:bg-slate-700/20 transition">
                      <td className="p-3 text-right font-medium">{user.name}</td>
                      <td className={`p-3 font-bold ${isPkText ? (pred?.pkWinner === 'A' ? 'text-emerald-400 text-xs' : 'text-slate-500 text-xs') : 'text-emerald-400'}`}>
                        {displayA}
                      </td>
                      <td className={`p-3 font-bold ${isPkText ? (pred?.pkWinner === 'B' ? 'text-emerald-400 text-xs' : 'text-slate-500 text-xs') : 'text-emerald-400'}`}>
                        {displayB}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


