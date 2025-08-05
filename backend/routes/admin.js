const express = require('express');
const { body, validationResult, query } = require('express-validator');
const supabase = require('../supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'super_admin']));

// Get all users with pagination and search
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('role').optional().isIn(['user', 'admin', 'super_admin']),
  query('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const role = req.query.role;
    const status = req.query.status;

    // Build query
    let query = supabase
      .from('profiles')
      .select('user_id, email, full_name, role, is_active, email_verified, last_login, created_at', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    if (status) {
      query = query.eq('is_active', status === 'active');
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      users,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(count / limit),
        total_users: count,
        per_page: limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, role, is_active, email_verified, last_login, created_at, updated_at')
      .eq('user_id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/users/:id', [
  body('email').optional().isEmail().normalizeEmail(),
  body('full_name').optional().trim().isLength({ min: 2 }),
  body('role').optional().isIn(['user', 'admin', 'super_admin']),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, full_name, role, is_active } = req.body;
    const updateData = {};
    
    if (email) updateData.email = email;
    if (full_name) updateData.full_name = full_name;
    if (role) updateData.role = role;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    
    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }

    res.json({
      message: '✅ User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Super Admin only)
router.delete('/users/:id', requireRole(['super_admin']), async (req, res) => {
  try {
    // Delete from profiles first
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', req.params.id);

    if (profileError) {
      throw profileError;
    }

    // Delete from auth.users (requires service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(req.params.id);

    if (authError) {
      console.error('Auth delete error:', authError);
      // Profile already deleted, so we continue
    }

    res.json({ message: '✅ User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get user counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: adminUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['admin', 'super_admin']);

    const { count: totalChats } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true });

    res.json({
      stats: {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        admin_users: adminUsers || 0,
        total_messages: totalChats || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;