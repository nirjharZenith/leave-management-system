import pool from './connection.js';

const initializeDatabase = async () => {
  try {
    console.log('Creating database schema...');

    // Create roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );
    `);
    console.log('✓ Roles table created');

    // Create employees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role_id INTEGER NOT NULL REFERENCES roles(id),
        manager_id INTEGER REFERENCES employees(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Employees table created');

    // Create leaves table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Leaves table created');

    // Create holidays table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Holidays table created');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id);
      CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
      CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON leaves(employee_id);
      CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
    `);
    console.log('✓ Indexes created');

    // Seed initial roles
    await pool.query(`
      INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('employee')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✓ Roles seeded');

    // Seed admin user (password: admin123)
    const hashedPassword = '$2a$10$rZLGe6jjvQxJQ8BV.jx5N.xHQq8u2b8Ql3P.OXVKr5Bb0.GLHfmDu';
    await pool.query(`
      INSERT INTO employees (email, password_hash, name, role_id)
      VALUES ('admin@company.com', $1, 'Admin User', (SELECT id FROM roles WHERE name = 'admin'))
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    console.log('✓ Admin user seeded (email: admin@company.com, password: admin123)');

    console.log('\n✓ Database schema initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
};

initializeDatabase();
