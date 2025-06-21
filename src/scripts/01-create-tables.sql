-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('ssg_super_admin', 'club_admin', 'department_admin', 'officer_in_charge', 'student');
CREATE TYPE clearance_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE attendance_type AS ENUM ('in', 'out');

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clubs table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id),
    year_level INTEGER CHECK (year_level >= 1 AND year_level <= 4),
    section TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club members table
CREATE TABLE club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, student_id)
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    club_id UUID REFERENCES clubs(id),
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type attendance_type NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID NOT NULL REFERENCES users(id),
    location TEXT
);

-- Clearance requests table
CREATE TABLE clearance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    department_status clearance_status DEFAULT 'pending',
    club_status clearance_status DEFAULT 'pending',
    ssg_status clearance_status DEFAULT 'pending',
    department_approved_by UUID REFERENCES users(id),
    club_approved_by UUID REFERENCES users(id),
    ssg_approved_by UUID REFERENCES users(id),
    department_approved_at TIMESTAMP WITH TIME ZONE,
    club_approved_at TIMESTAMP WITH TIME ZONE,
    ssg_approved_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sanctions table
CREATE TABLE sanctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    points_deducted INTEGER DEFAULT 0,
    assigned_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Officers in charge table
CREATE TABLE oics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    club_id UUID REFERENCES clubs(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
