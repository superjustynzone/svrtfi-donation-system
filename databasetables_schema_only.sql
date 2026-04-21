--
-- PostgreSQL database dump
--

\restrict c3HK4Ddoib9PweDkOErWZqYQkOOyyOjpnkpSdqCUPP0QAepeB4xoxGSyarOdCdo

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-04-21 19:25:17

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

--
-- TOC entry 268 (class 1255 OID 99936)
-- Name: generate_12digit_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_12digit_id() RETURNS bigint
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Generates a 12-digit unique number based on timestamp
    RETURN (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT % 100000000000 + 100000000000;
END;
$$;


ALTER FUNCTION public.generate_12digit_id() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 99937)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    audit_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    user_id bigint,
    action character varying(255) NOT NULL,
    details text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 99946)
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_audit_id_seq OWNER TO postgres;

--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 220
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_audit_id_seq OWNED BY public.audit_logs.audit_id;


--
-- TOC entry 221 (class 1259 OID 99947)
-- Name: auth_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_users (
    auth_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    user_id bigint,
    email character varying(255) NOT NULL,
    hash_password text NOT NULL,
    token text,
    reset_password_token text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    verification_code character varying(10)
);


ALTER TABLE public.auth_users OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 99958)
-- Name: auth_users_auth_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auth_users_auth_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_users_auth_id_seq OWNER TO postgres;

--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 222
-- Name: auth_users_auth_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auth_users_auth_id_seq OWNED BY public.auth_users.auth_id;


--
-- TOC entry 223 (class 1259 OID 99959)
-- Name: campaign_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaign_media (
    media_id bigint NOT NULL,
    campaign_id bigint,
    file_url text NOT NULL,
    media_type character varying(50) DEFAULT 'image'::character varying,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.campaign_media OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 99968)
-- Name: campaign_media_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campaign_media_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaign_media_media_id_seq OWNER TO postgres;

--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 224
-- Name: campaign_media_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campaign_media_media_id_seq OWNED BY public.campaign_media.media_id;


--
-- TOC entry 225 (class 1259 OID 99969)
-- Name: campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaigns (
    campaign_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    campaign_name character varying(200) NOT NULL,
    campaign_type character varying(100),
    campaign_description text,
    goal_amount numeric(12,2),
    current_amount numeric(12,2),
    start_date date,
    end_date date,
    file_url text,
    media_type character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    uploaded_at timestamp without time zone DEFAULT now(),
    is_featured boolean DEFAULT false,
    status character varying(20) DEFAULT 'draft'::character varying,
    receipt_email_subject character varying(255),
    receipt_email_message text
);


ALTER TABLE public.campaigns OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 99982)
-- Name: campaigns_campaign_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campaigns_campaign_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaigns_campaign_id_seq OWNER TO postgres;

--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 226
-- Name: campaigns_campaign_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campaigns_campaign_id_seq OWNED BY public.campaigns.campaign_id;


--
-- TOC entry 227 (class 1259 OID 99983)
-- Name: donation_reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donation_reminders (
    reminder_id bigint NOT NULL,
    donation_id bigint,
    user_id bigint,
    campaign_id bigint,
    started_date timestamp without time zone DEFAULT now(),
    next_payment date,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_reminder_date date
);


ALTER TABLE public.donation_reminders OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 99991)
-- Name: donation_reminders_reminder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donation_reminders_reminder_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donation_reminders_reminder_id_seq OWNER TO postgres;

--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 228
-- Name: donation_reminders_reminder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donation_reminders_reminder_id_seq OWNED BY public.donation_reminders.reminder_id;


--
-- TOC entry 229 (class 1259 OID 99992)
-- Name: donations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donations (
    donation_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    user_id bigint,
    campaign_id bigint,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(100),
    donation_source character varying(100),
    currency character varying(10) DEFAULT 'PHP'::character varying,
    frequency character varying(20) DEFAULT 'one_time'::character varying,
    next_due_date date,
    initiated_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    message text,
    donor_id bigint,
    status character varying(20) DEFAULT 'pending'::character varying,
    cancellation_reason text,
    receipt_number character varying(50),
    transaction_id character varying(50)
);


ALTER TABLE public.donations OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 100004)
-- Name: donations_donation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donations_donation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donations_donation_id_seq OWNER TO postgres;

--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 230
-- Name: donations_donation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donations_donation_id_seq OWNED BY public.donations.donation_id;


--
-- TOC entry 231 (class 1259 OID 100005)
-- Name: donors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donors (
    donor_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    email character varying(255),
    contact_number character varying(50),
    address text,
    created_at timestamp without time zone DEFAULT now(),
    tin_number character varying(50),
    address2 text,
    barangay character varying(100),
    province character varying(100),
    city character varying(100),
    zip_code character varying(20),
    country character varying(100)
);


ALTER TABLE public.donors OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 100013)
-- Name: donors_donor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donors_donor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donors_donor_id_seq OWNER TO postgres;

--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 232
-- Name: donors_donor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donors_donor_id_seq OWNED BY public.donors.donor_id;


--
-- TOC entry 233 (class 1259 OID 100014)
-- Name: email_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_campaigns (
    campaign_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    category character varying(100),
    status character varying(50) DEFAULT 'draft'::character varying,
    scheduled_at timestamp without time zone,
    created_by bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    associated_campaign_id bigint,
    from_email character varying(255),
    cc_email character varying(255),
    auto_send boolean DEFAULT false
);


ALTER TABLE public.email_campaigns OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 100027)
-- Name: email_campaigns_campaign_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_campaigns_campaign_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_campaigns_campaign_id_seq OWNER TO postgres;

--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 234
-- Name: email_campaigns_campaign_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_campaigns_campaign_id_seq OWNED BY public.email_campaigns.campaign_id;


--
-- TOC entry 235 (class 1259 OID 100028)
-- Name: email_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_logs (
    log_id integer NOT NULL,
    recipient_email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    message text,
    status character varying(50) DEFAULT 'success'::character varying,
    error_message text,
    sent_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_logs OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 100038)
-- Name: email_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_logs_log_id_seq OWNER TO postgres;

--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 236
-- Name: email_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_logs_log_id_seq OWNED BY public.email_logs.log_id;


--
-- TOC entry 237 (class 1259 OID 100039)
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates (
    template_id bigint NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    content text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_templates OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 100050)
-- Name: email_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_templates_template_id_seq OWNER TO postgres;

--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 238
-- Name: email_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_templates_template_id_seq OWNED BY public.email_templates.template_id;


--
-- TOC entry 239 (class 1259 OID 100051)
-- Name: foundation_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.foundation_campaigns (
    id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    foundation_id bigint,
    campaign_id bigint
);


ALTER TABLE public.foundation_campaigns OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 100056)
-- Name: foundation_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.foundation_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.foundation_campaigns_id_seq OWNER TO postgres;

--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 240
-- Name: foundation_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.foundation_campaigns_id_seq OWNED BY public.foundation_campaigns.id;


--
-- TOC entry 241 (class 1259 OID 100057)
-- Name: foundation_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.foundation_media (
    media_id bigint NOT NULL,
    foundation_id bigint,
    file_url text NOT NULL,
    media_type character varying(50) DEFAULT 'image'::character varying,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.foundation_media OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 100066)
-- Name: foundation_media_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.foundation_media_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.foundation_media_media_id_seq OWNER TO postgres;

--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 242
-- Name: foundation_media_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.foundation_media_media_id_seq OWNED BY public.foundation_media.media_id;


--
-- TOC entry 243 (class 1259 OID 100067)
-- Name: foundations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.foundations (
    foundation_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    foundation_name character varying(200) NOT NULL,
    foundation_address text,
    foundation_contact character varying(50),
    foundation_email character varying(150),
    bank_name text,
    bank_information text,
    image_logo text,
    image_cover text,
    focus_areas text,
    about_foundation text,
    mission text,
    vision text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.foundations OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 100077)
-- Name: foundations_foundation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.foundations_foundation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.foundations_foundation_id_seq OWNER TO postgres;

--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 244
-- Name: foundations_foundation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.foundations_foundation_id_seq OWNED BY public.foundations.foundation_id;


--
-- TOC entry 245 (class 1259 OID 100078)
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    payment_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    donation_id bigint,
    campaign_id bigint,
    payment_reference character varying(255),
    amount numeric(12,2) NOT NULL,
    payment_status character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    receipt_upload text
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 100087)
-- Name: payment_transactions_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_transactions_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_transactions_payment_id_seq OWNER TO postgres;

--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 246
-- Name: payment_transactions_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_transactions_payment_id_seq OWNED BY public.payment_transactions.payment_id;


--
-- TOC entry 247 (class 1259 OID 100088)
-- Name: receipt_sequences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipt_sequences (
    id integer NOT NULL,
    sequence_number character varying(255) NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.receipt_sequences OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 100095)
-- Name: receipt_sequences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.receipt_sequences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.receipt_sequences_id_seq OWNER TO postgres;

--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 248
-- Name: receipt_sequences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.receipt_sequences_id_seq OWNED BY public.receipt_sequences.id;


--
-- TOC entry 249 (class 1259 OID 100096)
-- Name: receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipts (
    receipt_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    donation_id bigint,
    file_url text,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.receipts OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 100104)
-- Name: receipts_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.receipts_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.receipts_receipt_id_seq OWNER TO postgres;

--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 250
-- Name: receipts_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.receipts_receipt_id_seq OWNED BY public.receipts.receipt_id;


--
-- TOC entry 251 (class 1259 OID 100105)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 100111)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 252
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 253 (class 1259 OID 100112)
-- Name: site_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_settings (
    setting_key character varying(255) NOT NULL,
    setting_value text NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.site_settings OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 100120)
-- Name: smtp_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.smtp_settings (
    id integer NOT NULL,
    provider character varying(50) DEFAULT 'Gmail'::character varying,
    host character varying(255) DEFAULT 'smtp.gmail.com'::character varying,
    port integer DEFAULT 465,
    user_email character varying(255),
    password character varying(255),
    encryption character varying(50) DEFAULT 'SSL/TLS'::character varying,
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sender_email character varying(255)
);


ALTER TABLE public.smtp_settings OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 100132)
-- Name: smtp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.smtp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.smtp_settings_id_seq OWNER TO postgres;

--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 255
-- Name: smtp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.smtp_settings_id_seq OWNED BY public.smtp_settings.id;


--
-- TOC entry 256 (class 1259 OID 100133)
-- Name: stories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stories (
    story_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    foundation_id bigint,
    title character varying(255) NOT NULL,
    content text,
    image_file text,
    is_published boolean DEFAULT false,
    published_at timestamp without time zone,
    author character varying(150),
    tags text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    scheduled_publish_at timestamp with time zone
);


ALTER TABLE public.stories OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 100144)
-- Name: stories_story_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stories_story_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stories_story_id_seq OWNER TO postgres;

--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 257
-- Name: stories_story_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stories_story_id_seq OWNED BY public.stories.story_id;


--
-- TOC entry 258 (class 1259 OID 100145)
-- Name: story_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.story_categories (
    category_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.story_categories OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 100151)
-- Name: story_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.story_categories_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.story_categories_category_id_seq OWNER TO postgres;

--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 259
-- Name: story_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.story_categories_category_id_seq OWNED BY public.story_categories.category_id;


--
-- TOC entry 260 (class 1259 OID 100152)
-- Name: story_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.story_images (
    image_id integer NOT NULL,
    story_id bigint,
    image_file text NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.story_images OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 100161)
-- Name: story_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.story_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.story_images_image_id_seq OWNER TO postgres;

--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 261
-- Name: story_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.story_images_image_id_seq OWNED BY public.story_images.image_id;


--
-- TOC entry 262 (class 1259 OID 100162)
-- Name: subscribers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscribers (
    subscriber_id integer NOT NULL,
    user_id bigint,
    email character varying(255) NOT NULL,
    full_name character varying(255),
    receipts_opt_in boolean DEFAULT true,
    newsletters_opt_in boolean DEFAULT false,
    status character varying(50) DEFAULT 'active'::character varying,
    subscribed_at timestamp without time zone DEFAULT now(),
    first_name character varying(100),
    last_name character varying(100),
    campaign_id bigint
);


ALTER TABLE public.subscribers OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 100173)
-- Name: subscribers_subscriber_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscribers_subscriber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscribers_subscriber_id_seq OWNER TO postgres;

--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 263
-- Name: subscribers_subscriber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscribers_subscriber_id_seq OWNED BY public.subscribers.subscriber_id;


--
-- TOC entry 264 (class 1259 OID 100174)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    user_id bigint,
    role_id bigint,
    assigned_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 100180)
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO postgres;

--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 265
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- TOC entry 266 (class 1259 OID 100181)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id bigint DEFAULT public.generate_12digit_id() NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    contact_number character varying(20),
    address text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    profile_image text,
    last_login timestamp without time zone,
    address2 text,
    barangay text,
    province text,
    city text,
    zip_code text,
    tin_number text,
    country text DEFAULT 'Philippines'::text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 100192)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 267
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4981 (class 2604 OID 100193)
-- Name: campaign_media media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_media ALTER COLUMN media_id SET DEFAULT nextval('public.campaign_media_media_id_seq'::regclass);


--
-- TOC entry 4990 (class 2604 OID 100194)
-- Name: donation_reminders reminder_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_reminders ALTER COLUMN reminder_id SET DEFAULT nextval('public.donation_reminders_reminder_id_seq'::regclass);


--
-- TOC entry 5007 (class 2604 OID 100195)
-- Name: email_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN log_id SET DEFAULT nextval('public.email_logs_log_id_seq'::regclass);


--
-- TOC entry 5010 (class 2604 OID 100196)
-- Name: email_templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN template_id SET DEFAULT nextval('public.email_templates_template_id_seq'::regclass);


--
-- TOC entry 5013 (class 2604 OID 100197)
-- Name: foundation_media media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foundation_media ALTER COLUMN media_id SET DEFAULT nextval('public.foundation_media_media_id_seq'::regclass);


--
-- TOC entry 5021 (class 2604 OID 100198)
-- Name: receipt_sequences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_sequences ALTER COLUMN id SET DEFAULT nextval('public.receipt_sequences_id_seq'::regclass);


--
-- TOC entry 5028 (class 2604 OID 100199)
-- Name: smtp_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smtp_settings ALTER COLUMN id SET DEFAULT nextval('public.smtp_settings_id_seq'::regclass);


--
-- TOC entry 5039 (class 2604 OID 100200)
-- Name: story_categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_categories ALTER COLUMN category_id SET DEFAULT nextval('public.story_categories_category_id_seq'::regclass);


--
-- TOC entry 5041 (class 2604 OID 100201)
-- Name: story_images image_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_images ALTER COLUMN image_id SET DEFAULT nextval('public.story_images_image_id_seq'::regclass);


--
-- TOC entry 5044 (class 2604 OID 100202)
-- Name: subscribers subscriber_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers ALTER COLUMN subscriber_id SET DEFAULT nextval('public.subscribers_subscriber_id_seq'::regclass);


--
-- TOC entry 5292 (class 0 OID 99937)
-- Dependencies: 219
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5294 (class 0 OID 99947)
-- Dependencies: 221
-- Data for Name: auth_users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5296 (class 0 OID 99959)
-- Dependencies: 223
-- Data for Name: campaign_media; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5298 (class 0 OID 99969)
-- Dependencies: 225
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5300 (class 0 OID 99983)
-- Dependencies: 227
-- Data for Name: donation_reminders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5302 (class 0 OID 99992)
-- Dependencies: 229
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5304 (class 0 OID 100005)
-- Dependencies: 231
-- Data for Name: donors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5306 (class 0 OID 100014)
-- Dependencies: 233
-- Data for Name: email_campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5308 (class 0 OID 100028)
-- Dependencies: 235
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5310 (class 0 OID 100039)
-- Dependencies: 237
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5312 (class 0 OID 100051)
-- Dependencies: 239
-- Data for Name: foundation_campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5314 (class 0 OID 100057)
-- Dependencies: 241
-- Data for Name: foundation_media; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5316 (class 0 OID 100067)
-- Dependencies: 243
-- Data for Name: foundations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5318 (class 0 OID 100078)
-- Dependencies: 245
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5320 (class 0 OID 100088)
-- Dependencies: 247
-- Data for Name: receipt_sequences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5322 (class 0 OID 100096)
-- Dependencies: 249
-- Data for Name: receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5324 (class 0 OID 100105)
-- Dependencies: 251
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5326 (class 0 OID 100112)
-- Dependencies: 253
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5327 (class 0 OID 100120)
-- Dependencies: 254
-- Data for Name: smtp_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5329 (class 0 OID 100133)
-- Dependencies: 256
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5331 (class 0 OID 100145)
-- Dependencies: 258
-- Data for Name: story_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5333 (class 0 OID 100152)
-- Dependencies: 260
-- Data for Name: story_images; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5335 (class 0 OID 100162)
-- Dependencies: 262
-- Data for Name: subscribers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5337 (class 0 OID 100174)
-- Dependencies: 264
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5339 (class 0 OID 100181)
-- Dependencies: 266
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 220
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_audit_id_seq', 63, true);


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 222
-- Name: auth_users_auth_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_users_auth_id_seq', 16, true);


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 224
-- Name: campaign_media_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campaign_media_media_id_seq', 20, true);


--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 226
-- Name: campaigns_campaign_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campaigns_campaign_id_seq', 18, true);


--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 228
-- Name: donation_reminders_reminder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donation_reminders_reminder_id_seq', 11, true);


--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 230
-- Name: donations_donation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donations_donation_id_seq', 32, true);


--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 232
-- Name: donors_donor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donors_donor_id_seq', 17, true);


--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 234
-- Name: email_campaigns_campaign_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_campaigns_campaign_id_seq', 1, false);


--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 236
-- Name: email_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_logs_log_id_seq', 159, true);


--
-- TOC entry 5379 (class 0 OID 0)
-- Dependencies: 238
-- Name: email_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_templates_template_id_seq', 1, true);


--
-- TOC entry 5380 (class 0 OID 0)
-- Dependencies: 240
-- Name: foundation_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.foundation_campaigns_id_seq', 51, true);


--
-- TOC entry 5381 (class 0 OID 0)
-- Dependencies: 242
-- Name: foundation_media_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.foundation_media_media_id_seq', 2, true);


--
-- TOC entry 5382 (class 0 OID 0)
-- Dependencies: 244
-- Name: foundations_foundation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.foundations_foundation_id_seq', 12, true);


--
-- TOC entry 5383 (class 0 OID 0)
-- Dependencies: 246
-- Name: payment_transactions_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_transactions_payment_id_seq', 30, true);


--
-- TOC entry 5384 (class 0 OID 0)
-- Dependencies: 248
-- Name: receipt_sequences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.receipt_sequences_id_seq', 9, true);


--
-- TOC entry 5385 (class 0 OID 0)
-- Dependencies: 250
-- Name: receipts_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.receipts_receipt_id_seq', 1, false);


--
-- TOC entry 5386 (class 0 OID 0)
-- Dependencies: 252
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 12, true);


--
-- TOC entry 5387 (class 0 OID 0)
-- Dependencies: 255
-- Name: smtp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.smtp_settings_id_seq', 1, true);


--
-- TOC entry 5388 (class 0 OID 0)
-- Dependencies: 257
-- Name: stories_story_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stories_story_id_seq', 2, true);


--
-- TOC entry 5389 (class 0 OID 0)
-- Dependencies: 259
-- Name: story_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.story_categories_category_id_seq', 3, true);


--
-- TOC entry 5390 (class 0 OID 0)
-- Dependencies: 261
-- Name: story_images_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.story_images_image_id_seq', 9, true);


--
-- TOC entry 5391 (class 0 OID 0)
-- Dependencies: 263
-- Name: subscribers_subscriber_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscribers_subscriber_id_seq', 134, true);


--
-- TOC entry 5392 (class 0 OID 0)
-- Dependencies: 265
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 14, true);


--
-- TOC entry 5393 (class 0 OID 0)
-- Dependencies: 267
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 19, true);


--
-- TOC entry 5057 (class 2606 OID 100253)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_id);


--
-- TOC entry 5059 (class 2606 OID 100255)
-- Name: auth_users auth_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_email_key UNIQUE (email);


--
-- TOC entry 5061 (class 2606 OID 100257)
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (auth_id);


--
-- TOC entry 5063 (class 2606 OID 100259)
-- Name: campaign_media campaign_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_media
    ADD CONSTRAINT campaign_media_pkey PRIMARY KEY (media_id);


--
-- TOC entry 5065 (class 2606 OID 100261)
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (campaign_id);


--
-- TOC entry 5067 (class 2606 OID 100263)
-- Name: donation_reminders donation_reminders_donation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_reminders
    ADD CONSTRAINT donation_reminders_donation_id_key UNIQUE (donation_id);


--
-- TOC entry 5069 (class 2606 OID 100265)
-- Name: donation_reminders donation_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_reminders
    ADD CONSTRAINT donation_reminders_pkey PRIMARY KEY (reminder_id);


--
-- TOC entry 5071 (class 2606 OID 100267)
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (donation_id);


--
-- TOC entry 5073 (class 2606 OID 100536)
-- Name: donations donations_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_transaction_id_key UNIQUE (transaction_id);


--
-- TOC entry 5075 (class 2606 OID 100269)
-- Name: donors donors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_pkey PRIMARY KEY (donor_id);


--
-- TOC entry 5077 (class 2606 OID 100271)
-- Name: email_campaigns email_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_pkey PRIMARY KEY (campaign_id);


--
-- TOC entry 5079 (class 2606 OID 100273)
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 5081 (class 2606 OID 100275)
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (template_id);


--
-- TOC entry 5083 (class 2606 OID 100277)
-- Name: email_templates email_templates_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_slug_key UNIQUE (slug);


--
-- TOC entry 5085 (class 2606 OID 100279)
-- Name: foundation_campaigns foundation_campaigns_foundation_id_campaign_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foundation_campaigns
    ADD CONSTRAINT foundation_campaigns_foundation_id_campaign_id_key UNIQUE (foundation_id, campaign_id);


--
-- TOC entry 5087 (class 2606 OID 100281)
-- Name: foundation_campaigns foundation_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foundation_campaigns
    ADD CONSTRAINT foundation_campaigns_pkey PRIMARY KEY (id);


--
-- TOC entry 5089 (class 2606 OID 100283)
-- Name: foundation_media foundation_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foundation_media
    ADD CONSTRAINT foundation_media_pkey PRIMARY KEY (media_id);


--
-- TOC entry 5091 (class 2606 OID 100285)
-- Name: foundations foundations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foundations
    ADD CONSTRAINT foundations_pkey PRIMARY KEY (foundation_id);


--
-- TOC entry 5093 (class 2606 OID 100287)
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (payment_id);


--
-- TOC entry 5095 (class 2606 OID 100289)
-- Name: receipt_sequences receipt_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_sequences
    ADD CONSTRAINT receipt_sequences_pkey PRIMARY KEY (id);


--
-- TOC entry 5097 (class 2606 OID 100291)
-- Name: receipt_sequences receipt_sequences_sequence_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipt_sequences
    ADD CONSTRAINT receipt_sequences_sequence_number_key UNIQUE (sequence_number);


--
-- TOC entry 5099 (class 2606 OID 100293)
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (receipt_id);


--
-- TOC entry 5101 (class 2606 OID 100295)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 5103 (class 2606 OID 100297)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 5105 (class 2606 OID 100299)
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (setting_key);


--
-- TOC entry 5107 (class 2606 OID 100301)
-- Name: smtp_settings smtp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5109 (class 2606 OID 100303)
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (story_id);


--
-- TOC entry 5111 (class 2606 OID 100305)
-- Name: story_categories story_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_categories
    ADD CONSTRAINT story_categories_name_key UNIQUE (name);


--
-- TOC entry 5113 (class 2606 OID 100307)
-- Name: story_categories story_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_categories
    ADD CONSTRAINT story_categories_pkey PRIMARY KEY (category_id);


--
-- TOC entry 5115 (class 2606 OID 100309)
-- Name: story_images story_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_images
    ADD CONSTRAINT story_images_pkey PRIMARY KEY (image_id);


--
-- TOC entry 5117 (class 2606 OID 100311)
-- Name: subscribers subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_email_key UNIQUE (email);


--
-- TOC entry 5119 (class 2606 OID 100313)
-- Name: subscribers subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_pkey PRIMARY KEY (subscriber_id);


--
-- TOC entry 5121 (class 2606 OID 100315)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5123 (class 2606 OID 100317)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5124 (class 2606 OID 100318)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5125 (class 2606 OID 100323)
-- Name: auth_users auth_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5126 (class 2606 OID 100328)
-- Name: campaign_media campaign_media_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_media
    ADD CONSTRAINT campaign_media_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(campaign_id) ON DELETE CASCADE;


--
-- TOC entry 5127 (class 2606 OID 100333)
-- Name: donation_reminders donation_reminders_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_reminders
    ADD CONSTRAINT donation_reminders_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(campaign_id) ON DELETE CASCADE;


--
-- TOC entry 5128 (class 2606 OID 100338)
-- Name: donation_reminders donation_reminders_donation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_reminders
    ADD CONSTRAINT donation_reminders_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES public.donations(donation_id) ON DELETE CASCADE;


--
-- TOC entry 5129 (class 2606 OID 100343)
-- Name: donation_reminders donation_reminders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_reminders
    ADD CONSTRAINT donation_reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 100929)
-- Name: donations donations_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(campaign_id) ON DELETE CASCADE;


--
-- TOC entry 5131 (class 2606 OID 100353)
-- Name: donations donations_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donors(donor_id);


--
-- TOC entry 5132 (class 2606 OID 100358)
-- Name: donations donations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5133 (class 2606 OID 100363)
-- Name: email_campaigns email_campaigns_associated_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_associated_campaign_id_fkey FOREIGN KEY (associated_campaign_id) REFERENCES public.campaigns(campaign_id) ON DELETE SET NULL;


--
-- TOC entry 5134 (class 2606 OID 100368)
-- Name: email_campaigns email_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5135 (class 2606 OID 100373)
-- Name: foundation_media foundation_media_foundation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.foundation_media
    ADD CONSTRAINT foundation_media_foundation_id_fkey FOREIGN KEY (foundation_id) REFERENCES public.foundations(foundation_id) ON DELETE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 100935)
-- Name: payment_transactions payment_transactions_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(campaign_id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 100383)
-- Name: payment_transactions payment_transactions_donation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES public.donations(donation_id) ON DELETE CASCADE;


--
-- TOC entry 5138 (class 2606 OID 100388)
-- Name: receipts receipts_donation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES public.donations(donation_id) ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 100393)
-- Name: stories stories_foundation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_foundation_id_fkey FOREIGN KEY (foundation_id) REFERENCES public.foundations(foundation_id) ON DELETE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 100398)
-- Name: story_images story_images_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_images
    ADD CONSTRAINT story_images_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(story_id) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 100403)
-- Name: subscribers subscribers_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(campaign_id) ON DELETE SET NULL;


--
-- TOC entry 5142 (class 2606 OID 100408)
-- Name: subscribers subscribers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5143 (class 2606 OID 100413)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 100418)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2026-04-21 19:25:18

--
-- PostgreSQL database dump complete
--

\unrestrict c3HK4Ddoib9PweDkOErWZqYQkOOyyOjpnkpSdqCUPP0QAepeB4xoxGSyarOdCdo

