-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "SSG Super Admin can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'ssg_super_admin'
        )
    );

-- Students policies
CREATE POLICY "Students can view their own record" ON students
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Admins can view students in their scope" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND (
                u.role = 'ssg_super_admin' OR
                (u.role = 'department_admin' AND EXISTS (
                    SELECT 1 FROM students s2 
                    WHERE s2.user_id = u.id AND s2.department_id = students.department_id
                )) OR
                (u.role = 'club_admin' AND EXISTS (
                    SELECT 1 FROM club_members cm 
                    WHERE cm.student_id = students.id
                ))
            )
        )
    );

-- Departments policies
CREATE POLICY "Everyone can view departments" ON departments
    FOR SELECT USING (true);

CREATE POLICY "Only SSG Super Admin can modify departments" ON departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'ssg_super_admin'
        )
    );

-- Clubs policies
CREATE POLICY "Everyone can view clubs" ON clubs
    FOR SELECT USING (true);

CREATE POLICY "SSG Super Admin and Club Admin can modify clubs" ON clubs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('ssg_super_admin', 'club_admin')
        )
    );

-- Events policies
CREATE POLICY "Everyone can view events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Admins can create events in their scope" ON events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND (
                u.role = 'ssg_super_admin' OR
                (u.role = 'department_admin' AND department_id IS NOT NULL) OR
                (u.role = 'club_admin' AND club_id IS NOT NULL)
            )
        )
    );

-- Attendance policies
CREATE POLICY "Students can view their own attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = student_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "OICs can record attendance" ON attendance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'officer_in_charge'
        )
    );

-- Clearance requests policies
CREATE POLICY "Students can view their own clearance requests" ON clearance_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = student_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Students can create clearance requests" ON clearance_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = student_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view and update clearance requests in their scope" ON clearance_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND (
                u.role = 'ssg_super_admin' OR
                u.role = 'department_admin' OR
                u.role = 'club_admin'
            )
        )
    );

-- Messages policies
CREATE POLICY "Users can view messages sent to them or by them" ON messages
    FOR SELECT USING (
        from_user_id = auth.uid() OR to_user_id = auth.uid()
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- Sanctions policies
CREATE POLICY "Students can view their own sanctions" ON sanctions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = student_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage sanctions" ON sanctions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('ssg_super_admin', 'department_admin', 'club_admin')
        )
    );

-- OICs policies
CREATE POLICY "Everyone can view OICs" ON oics
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage OICs" ON oics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('ssg_super_admin', 'department_admin', 'club_admin')
        )
    );
