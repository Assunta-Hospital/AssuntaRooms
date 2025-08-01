
-- USERS TABLE
CREATE TABLE public.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- assume already hashed
    dept_id UUID REFERENCES public.department(dept_id) ON DELETE SET NULL,
    pfp_url TEXT,
    status TEXT CHECK (status IN ('approved', 'pending', 'rejected', 'suspended')) DEFAULT 'pending',
    role TEXT CHECK (role IN ('admin', 'manager', 'user')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DEPARTMENT TABLE
CREATE TABLE public.department (
    dept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ROOMS TABLE
CREATE TABLE public.rooms (
    room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    location TEXT,
    room_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- BOOKINGS TABLE
CREATE TABLE public.bookings (
    bookings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(room_id) ON DELETE CASCADE,
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- STATS TABLE
CREATE TABLE public.stats (
    stats_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.rooms(room_id) ON DELETE CASCADE,
    bookings_id UUID REFERENCES public.bookings(bookings_id) ON DELETE CASCADE,
    dept_id UUID REFERENCES public.department(dept_id) ON DELETE CASCADE
);
