import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.mjs';
import { getStatements } from '../db/statements/index.mjs';
import { bannedUserIds } from '../services/cache.mjs';
import { formatUserResponse } from '../services/user-service.mjs';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { email, password, full_name, legal_name, name, role, phone, country, location } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (full_name || legal_name || name || '').trim();
    const cleanCountry = (country || location || '').trim() || 'الأردن';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال بريد إلكتروني صالح' });
    }
    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال الاسم بالكامل' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن لا تقل عن ٦ أحرف' });
    }

    const stmts = getStatements();
    const existingUser = stmts.stmtFindUserByEmail.get(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول' });
    }

    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '') || 'user';
    let finalUsername = baseUsername;
    let counter = 1;
    while (stmts.stmtFindUserByUsername.get(finalUsername)) {
      finalUsername = `${baseUsername}_${counter++}`;
    }

    const userId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const monthsArabic = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const now = new Date();
    const joinDate = `${monthsArabic[now.getMonth()]} ${now.getFullYear()}`;

    const userRole = role === 'organization' || role === 'org' ? 'org' : 'individual';

    stmts.stmtInsertUser.run({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      username: finalUsername,
      password_hash: passwordHash,
      role: userRole,
      phone: (phone || '').trim(),
      avatar: '',
      bio: userRole === 'org' ? 'منظمة معتمدة في منصة سرد رقمي' : 'عضو في مجتمع سرد رقمي',
      location: cleanCountry,
      country: cleanCountry,
      join_date: joinDate,
      verified: userRole === 'org' ? 1 : 0,
      is_banned: 0,
      ban_reason: '',
      created_at: Date.now(),
    });

    const token = jwt.sign({ id: userId, email: cleanEmail, role: userRole }, JWT_SECRET, { expiresIn: '30d' });
    const createdUser = stmts.stmtFindUserById.get(userId);

    res.status(201).json({
      success: true,
      token,
      userId,
      user: formatUserResponse(createdUser),
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'حدث خطأ غير متوقع أثناء إنشاء الحساب' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const stmts = getStatements();
    const user = stmts.stmtFindUserByEmail.get(cleanEmail) || stmts.stmtFindUserByUsername.get(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة، يرجى التأكد' });
    }

    // Ban check O(1)
    if (bannedUserIds.has(user.id) || user.is_banned) {
      return res.status(403).json({
        success: false,
        message: user.ban_reason ? `تم حظر هذا الحساب: ${user.ban_reason}` : 'تم حظر هذا الحساب لمخالفته شروط المنصة',
        is_banned: true,
      });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة، يرجى التأكد' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

export default router;
