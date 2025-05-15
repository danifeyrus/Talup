--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-04-11 09:25:19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16425)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text,
    gender text,
    language text,
    birthdate text,
    current_level text,
    aim_level text,
    goals text[],
    streak_count bigint,
    checked_days text[],
    xp bigint,
    max_xp bigint,
    level bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "time" text,
    avatar text,
    streak_days text[],
    last_login text,
    study_time text,
    last_active_date text,
    learned_words bigint,
    learning_words bigint,
    tree_phase bigint DEFAULT 0,
    today_learned_words bigint DEFAULT 0,
    tree_phase_progress numeric DEFAULT 0
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16424)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4905 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4742 (class 2604 OID 16428)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4899 (class 0 OID 16425)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, name, gender, language, birthdate, current_level, aim_level, goals, streak_count, checked_days, xp, max_xp, level, created_at, "time", avatar, streak_days, last_login, study_time, last_active_date, learned_words, learning_words, tree_phase, today_learned_words, tree_phase_progress) FROM stdin;
34	danifeyrus	danifeyrus@gmail.com	$2a$10$SwOrLmsODAhh3Yyo4ktJi.10HTrwa4aHQ8ORdotDc5wD0dxIo9HSa	Данияр	male	kazakh	11.08.2004	start	B2	{business}	4	{СБ,ПН,ВТ}	0	0	0	2025-04-03 10:57:25.644955	one	/uploads/avatars/user_34_1743866344.jpeg	{ПН,ВТ,СР}	2025-04-09		2025-04-08	5000	0	0	1	56.666666666666664
59	streak	streak@streak.com	$2a$10$UyZBW/Apk//cJO47bwgUFuFN1LCy8N031BXLvAidSkf96Cu3IRiVe	Streak	male	russian	11.08.2004	medium	B1	{fun,business,movies}	5	{ВТ,СР}	0	0	0	2025-04-07 12:04:14.543315	three	/uploads/avatars/avadefault.png	{ПН,ВТ,СР,ЧТ}	2025-04-10		2025-04-09	0	0	0	0	50
57	kwuzo	kwuzo@mail.ru	$2a$10$/nKMmhq70I/WUNqMvWw.KeKKtqgNICyddka9ypRlr7oTn5mVT48Iy	Daniil	male	russian	19.07.2004	start	B2	{fun,business,movies}	1	{СБ}	0	0	0	2025-04-05 19:44:17.894199	three	/uploads/avatars/user_57_1743866187.jpeg	{СБ}	2025-04-05		2025-04-05	10000	0	5	120	0
58	asakhi	asakhi@mail.ru	$2a$10$w.mulYERYSmhDd.Q.1w/T.cp6Bikf7YLY4IsIy.qyo2DX2O4nYrnG	Amir	male	russian	18.10.2002	start	B1	{fun}	1	\N	0	0	0	2025-04-05 20:22:25.308414	three	/uploads/avatars/user_58_1743866575.jpeg	{СБ}	2025-04-05			2500	0	0	550	0
60	skaka	skaakakw@gmail.com	$2a$10$POCutsDBOtO9klbfrLvpPuJLPCQ9XoOCXJ.5JlKnQtRjQjAiruujC	Xmxmdn	male	russian	11.08.2004	medium	B1	{fun,business,movies,education,travel,other}	1	\N	0	0	0	2025-04-08 10:28:11.936963	more	/uploads/avatars/avadefault.png	{ВТ}	2025-04-08			0	0	0	0	10
55	alissa	alissa@gmail.com	$2a$10$M3KlERnuXlMe.DSuX./0xeD9muxUWR5gD2aXLvSafU7YzG12/HOuC	Алиса	female	russian	27.08.2004	start	B2	{education}	1	{СБ,ПН}	0	0	0	2025-04-04 12:05:31.963036	two	/uploads/avatars/user_55_1743866297.jpeg	{ПН}	2025-04-07		2025-04-07	1	0	0	1	26.666666666666668
\.


--
-- TOC entry 4906 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 60, true);


--
-- TOC entry 4748 (class 2606 OID 16445)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4750 (class 2606 OID 16437)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4752 (class 2606 OID 16443)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


-- Completed on 2025-04-11 09:25:20

--
-- PostgreSQL database dump complete
--

