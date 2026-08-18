-- ==============================================================================
-- DDL SQL POSTGRESQL (SUPABASE COMPATIBLE)
-- APLIKASI WEB TRY OUT DAN MANAJEMEN BIMBINGAN BELAJAR (BIMBEL)
-- ==============================================================================


CREATE TABLE public.bimbel_settings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  bimbel_name character varying NOT NULL DEFAULT 'Bimbel Champion Academy'::character varying,
  owner_name character varying,
  address text,
  phone character varying,
  logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bimbel_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.classes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL UNIQUE,
  student_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staff_users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['admin'::character varying, 'guru'::character varying]::text[])),
  avatar_url text,
  subjects jsonb DEFAULT '[]'::jsonb,
  password_hash text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subjects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.announcements (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title character varying NOT NULL,
  target_class character varying NOT NULL DEFAULT 'Semua Kelas'::character varying,
  content text NOT NULL,
  date character varying NOT NULL,
  author character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.question_packages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  subject_id bigint,
  subject_name character varying NOT NULL,
  teacher_id bigint,
  teacher_name character varying NOT NULL,
  code character varying NOT NULL,
  name character varying NOT NULL,
  classes jsonb DEFAULT '[]'::jsonb,
  is_random_order boolean DEFAULT true,
  duration_minutes integer DEFAULT 90,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT question_packages_pkey PRIMARY KEY (id),
  CONSTRAINT question_packages_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT question_packages_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.staff_users(id)
);
CREATE TABLE public.questions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  package_id bigint,
  question_type character varying NOT NULL CHECK (question_type::text = ANY (ARRAY['single_choice'::character varying, 'true_false'::character varying, 'complex_choice'::character varying, 'graded_choice'::character varying]::text[])),
  type_label character varying NOT NULL,
  content text NOT NULL,
  discussion text,
  points_default integer DEFAULT 10,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.question_packages(id)
);
CREATE TABLE public.tryout_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  package_id bigint,
  title character varying NOT NULL,
  token character varying NOT NULL,
  duration_minutes integer NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  is_random_order boolean DEFAULT true,
  show_result_to_student boolean DEFAULT true,
  is_active boolean DEFAULT true,
  allowed_class_names jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tryout_items_pkey PRIMARY KEY (id),
  CONSTRAINT tryout_items_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.question_packages(id)
);
CREATE TABLE public.exam_sessions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  student_id bigint,
  student_name character varying NOT NULL,
  student_nis character varying NOT NULL,
  class_name character varying NOT NULL,
  tryout_id bigint,
  tryout_title character varying NOT NULL,
  start_time timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'finished'::character varying, 'blocked'::character varying]::text[])),
  answers jsonb DEFAULT '[]'::jsonb,
  final_score numeric DEFAULT 0.00,
  violations_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exam_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_sessions_tryout_id_fkey FOREIGN KEY (tryout_id) REFERENCES public.tryout_items(id)
);
CREATE TABLE public.exam_scores (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  student_nis character varying NOT NULL,
  student_name character varying NOT NULL,
  class_name character varying NOT NULL,
  subject_name character varying NOT NULL,
  tryout_title character varying NOT NULL,
  answers jsonb DEFAULT '[]'::jsonb,
  final_score numeric DEFAULT 0.00,
  total_correct integer NOT NULL,
  total_wrong integer NOT NULL,
  show_review boolean DEFAULT false,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exam_scores_pkey PRIMARY KEY (id)
);
CREATE TABLE public.student_users (
  id bigint NOT NULL,
  class_id bigint,
  class_name character varying NOT NULL,
  nis character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  date_of_birth date,
  username character varying NOT NULL UNIQUE,
  password character varying NOT NULL DEFAULT '123'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_users_pkey PRIMARY KEY (id)
);