--
-- PostgreSQL database dump
--

\restrict Ut8pwXqa5fftqxSkFzjQKac4iEDhqbeLsy2vbLNKH7WHW9VJrBwnpXNcQiujBXm

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: arbitres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arbitres (
    id bigint NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    num_licence character varying(50) NOT NULL,
    poste character varying(255) NOT NULL,
    specification character varying(255) NOT NULL,
    region character varying(100),
    est_actif boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT arbitres_poste_check CHECK (((poste)::text = ANY ((ARRAY['central'::character varying, 'assistant'::character varying, 'quatrieme_arbitre'::character varying, 'var'::character varying])::text[]))),
    CONSTRAINT arbitres_specification_check CHECK (((specification)::text = ANY ((ARRAY['national'::character varying, 'international'::character varying, 'fifa'::character varying])::text[])))
);


ALTER TABLE public.arbitres OWNER TO postgres;

--
-- Name: arbitres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.arbitres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.arbitres_id_seq OWNER TO postgres;

--
-- Name: arbitres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.arbitres_id_seq OWNED BY public.arbitres.id;


--
-- Name: articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.articles (
    id bigint NOT NULL,
    journaliste_id bigint NOT NULL,
    valide_par bigint,
    titre character varying(255) NOT NULL,
    contenu text NOT NULL,
    image_url character varying(255),
    categorie character varying(255) DEFAULT 'autre'::character varying NOT NULL,
    statut character varying(255) DEFAULT 'brouillon'::character varying NOT NULL,
    motif_rejet text,
    date_soumission timestamp(0) without time zone,
    date_publication timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT articles_categorie_check CHECK (((categorie)::text = ANY ((ARRAY['match'::character varying, 'transfert'::character varying, 'club'::character varying, 'selection'::character varying, 'officiel'::character varying, 'autre'::character varying])::text[]))),
    CONSTRAINT articles_statut_check CHECK (((statut)::text = ANY ((ARRAY['brouillon'::character varying, 'soumis'::character varying, 'valide'::character varying, 'publie'::character varying, 'rejete'::character varying, 'archive'::character varying])::text[])))
);


ALTER TABLE public.articles OWNER TO postgres;

--
-- Name: articles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.articles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.articles_id_seq OWNER TO postgres;

--
-- Name: articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.articles_id_seq OWNED BY public.articles.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id bigint,
    action character varying(100) NOT NULL,
    entite_concernee character varying(50) NOT NULL,
    entite_id bigint,
    anciennes_valeurs jsonb,
    nouvelles_valeurs jsonb,
    ip_adresse character varying(45),
    user_agent character varying(255),
    "timestamp" timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


ALTER TABLE public.cache OWNER TO postgres;

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO postgres;

--
-- Name: classements_clubs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classements_clubs (
    id bigint NOT NULL,
    club_id bigint NOT NULL,
    phase_id bigint NOT NULL,
    poule_id bigint,
    points integer DEFAULT 0 NOT NULL,
    victoires integer DEFAULT 0 NOT NULL,
    nuls integer DEFAULT 0 NOT NULL,
    defaites integer DEFAULT 0 NOT NULL,
    buts_pour integer DEFAULT 0 NOT NULL,
    buts_contre integer DEFAULT 0 NOT NULL,
    diff_buts integer DEFAULT 0 NOT NULL,
    cartons_jaunes integer DEFAULT 0 NOT NULL,
    cartons_rouges integer DEFAULT 0 NOT NULL,
    points_penalite integer DEFAULT 0 NOT NULL,
    "position" integer,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_classement_valeurs_positives CHECK (((points >= 0) AND (victoires >= 0) AND (nuls >= 0) AND (defaites >= 0) AND (buts_pour >= 0) AND (buts_contre >= 0) AND (cartons_jaunes >= 0) AND (cartons_rouges >= 0) AND (points_penalite >= 0)))
);


ALTER TABLE public.classements_clubs OWNER TO postgres;

--
-- Name: classements_clubs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classements_clubs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classements_clubs_id_seq OWNER TO postgres;

--
-- Name: classements_clubs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classements_clubs_id_seq OWNED BY public.classements_clubs.id;


--
-- Name: club_poule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.club_poule (
    id bigint NOT NULL,
    club_id bigint NOT NULL,
    poule_id bigint NOT NULL,
    saison_id bigint NOT NULL,
    date_affectation date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.club_poule OWNER TO postgres;

--
-- Name: club_poule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.club_poule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.club_poule_id_seq OWNER TO postgres;

--
-- Name: club_poule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.club_poule_id_seq OWNED BY public.club_poule.id;


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clubs (
    id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    ville character varying(100) NOT NULL,
    stade character varying(150),
    logo_url character varying(255),
    couleurs character varying(100),
    division character varying(255) NOT NULL,
    annee_creation integer,
    president character varying(150),
    est_actif boolean DEFAULT true NOT NULL,
    responsable_id bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT clubs_division_check CHECK (((division)::text = ANY ((ARRAY['elite_one'::character varying, 'elite_two'::character varying, 'regionale'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.clubs OWNER TO postgres;

--
-- Name: clubs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clubs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clubs_id_seq OWNER TO postgres;

--
-- Name: clubs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clubs_id_seq OWNED BY public.clubs.id;


--
-- Name: commentaires; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commentaires (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    mobile_user_id bigint NOT NULL,
    pseudo character varying(50) NOT NULL,
    texte text NOT NULL,
    statut character varying(255) DEFAULT 'visible'::character varying NOT NULL,
    timestamp_commentaire timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_commentaire_longueur CHECK ((length(texte) <= 500)),
    CONSTRAINT chk_commentaire_texte CHECK ((length(TRIM(BOTH FROM texte)) > 0)),
    CONSTRAINT commentaires_statut_check CHECK (((statut)::text = ANY ((ARRAY['visible'::character varying, 'modere'::character varying, 'supprime'::character varying])::text[])))
);


ALTER TABLE public.commentaires OWNER TO postgres;

--
-- Name: commentaires_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.commentaires_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.commentaires_id_seq OWNER TO postgres;

--
-- Name: commentaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.commentaires_id_seq OWNED BY public.commentaires.id;


--
-- Name: competitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competitions (
    id bigint NOT NULL,
    nom character varying(255) NOT NULL,
    niveau character varying(255) NOT NULL,
    pays character varying(100) DEFAULT 'Cameroun'::character varying NOT NULL,
    organisateur character varying(150) DEFAULT 'FECAFOOT'::character varying NOT NULL,
    sponsor_titre character varying(150),
    est_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT competitions_niveau_check CHECK (((niveau)::text = ANY ((ARRAY['elite_one'::character varying, 'elite_two'::character varying, 'coupe'::character varying, 'autre'::character varying])::text[])))
);


ALTER TABLE public.competitions OWNER TO postgres;

--
-- Name: competitions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.competitions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.competitions_id_seq OWNER TO postgres;

--
-- Name: competitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.competitions_id_seq OWNED BY public.competitions.id;


--
-- Name: composition_joueurs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.composition_joueurs (
    id bigint NOT NULL,
    composition_id bigint NOT NULL,
    joueur_id bigint NOT NULL,
    est_titulaire boolean DEFAULT true NOT NULL,
    est_capitaine boolean DEFAULT false NOT NULL,
    minute_entree integer,
    minute_sortie integer,
    numero_maillot_match integer,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_compo_minute_entree CHECK (((minute_entree IS NULL) OR ((minute_entree >= 0) AND (minute_entree <= 120)))),
    CONSTRAINT chk_compo_minute_sortie CHECK (((minute_sortie IS NULL) OR (((minute_sortie >= 0) AND (minute_sortie <= 130)) AND ((minute_entree IS NULL) OR (minute_sortie > minute_entree)))))
);


ALTER TABLE public.composition_joueurs OWNER TO postgres;

--
-- Name: composition_joueurs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.composition_joueurs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.composition_joueurs_id_seq OWNER TO postgres;

--
-- Name: composition_joueurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.composition_joueurs_id_seq OWNED BY public.composition_joueurs.id;


--
-- Name: compositions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compositions (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    club_id bigint NOT NULL,
    soumis_par bigint NOT NULL,
    statut character varying(255) DEFAULT 'brouillon'::character varying NOT NULL,
    est_confirmee boolean DEFAULT false NOT NULL,
    date_soumission timestamp(0) without time zone,
    date_confirmation timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT compositions_statut_check CHECK (((statut)::text = ANY ((ARRAY['brouillon'::character varying, 'soumise'::character varying, 'confirmee'::character varying, 'verrouillee'::character varying])::text[])))
);


ALTER TABLE public.compositions OWNER TO postgres;

--
-- Name: compositions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compositions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compositions_id_seq OWNER TO postgres;

--
-- Name: compositions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compositions_id_seq OWNED BY public.compositions.id;


--
-- Name: contestations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contestations (
    id bigint NOT NULL,
    match_event_id bigint NOT NULL,
    coach_id bigint NOT NULL,
    match_id bigint NOT NULL,
    motif text NOT NULL,
    statut character varying(255) DEFAULT 'en_attente'::character varying NOT NULL,
    decision text,
    traitee_par bigint,
    date_contestation timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_decision timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT contestations_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'acceptee'::character varying, 'rejetee'::character varying])::text[])))
);


ALTER TABLE public.contestations OWNER TO postgres;

--
-- Name: contestations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contestations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contestations_id_seq OWNER TO postgres;

--
-- Name: contestations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contestations_id_seq OWNED BY public.contestations.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.failed_jobs_id_seq OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: feuilles_de_match; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feuilles_de_match (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    score_final_domicile integer NOT NULL,
    score_final_exterieur integer NOT NULL,
    rapport_incidents text,
    statut character varying(255) DEFAULT 'brouillon'::character varying NOT NULL,
    date_generation timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_soumission timestamp(0) without time zone,
    date_validation timestamp(0) without time zone,
    valide_par bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_feuille_scores_positifs CHECK (((score_final_domicile >= 0) AND (score_final_exterieur >= 0))),
    CONSTRAINT feuilles_de_match_statut_check CHECK (((statut)::text = ANY ((ARRAY['brouillon'::character varying, 'soumise'::character varying, 'validee'::character varying, 'verrouillee'::character varying])::text[])))
);


ALTER TABLE public.feuilles_de_match OWNER TO postgres;

--
-- Name: feuilles_de_match_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feuilles_de_match_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feuilles_de_match_id_seq OWNER TO postgres;

--
-- Name: feuilles_de_match_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feuilles_de_match_id_seq OWNED BY public.feuilles_de_match.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: joueurs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.joueurs (
    id bigint NOT NULL,
    club_id bigint,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    date_naissance date NOT NULL,
    nationalite character varying(100) DEFAULT 'Camerounaise'::character varying NOT NULL,
    poste character varying(255) NOT NULL,
    num_maillot integer,
    num_licence character varying(50) NOT NULL,
    statut character varying(255) DEFAULT 'en_attente'::character varying NOT NULL,
    photo_url character varying(255),
    taille_cm integer,
    poids_kg integer,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_joueur_age_minimum CHECK ((date_naissance <= (CURRENT_DATE - '15 years'::interval))),
    CONSTRAINT chk_joueur_num_maillot CHECK (((num_maillot IS NULL) OR ((num_maillot >= 1) AND (num_maillot <= 99)))),
    CONSTRAINT chk_joueur_taille CHECK (((taille_cm IS NULL) OR ((taille_cm >= 140) AND (taille_cm <= 220)))),
    CONSTRAINT joueurs_poste_check CHECK (((poste)::text = ANY ((ARRAY['gardien'::character varying, 'defenseur_central'::character varying, 'lateral_droit'::character varying, 'lateral_gauche'::character varying, 'milieu_defensif'::character varying, 'milieu_central'::character varying, 'milieu_offensif'::character varying, 'ailier_droit'::character varying, 'ailier_gauche'::character varying, 'attaquant_centre'::character varying, 'avant_centre'::character varying])::text[]))),
    CONSTRAINT joueurs_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'valide'::character varying, 'suspendu'::character varying, 'blesse'::character varying, 'transfere'::character varying])::text[])))
);


ALTER TABLE public.joueurs OWNER TO postgres;

--
-- Name: joueurs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.joueurs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.joueurs_id_seq OWNER TO postgres;

--
-- Name: joueurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.joueurs_id_seq OWNED BY public.joueurs.id;


--
-- Name: match_arbitres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_arbitres (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    arbitre_id bigint NOT NULL,
    role character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT match_arbitres_role_check CHECK (((role)::text = ANY ((ARRAY['central'::character varying, 'assistant_1'::character varying, 'assistant_2'::character varying, 'quatrieme'::character varying])::text[])))
);


ALTER TABLE public.match_arbitres OWNER TO postgres;

--
-- Name: match_arbitres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_arbitres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_arbitres_id_seq OWNER TO postgres;

--
-- Name: match_arbitres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_arbitres_id_seq OWNED BY public.match_arbitres.id;


--
-- Name: match_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_events (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    type character varying(255) NOT NULL,
    joueur_id bigint,
    joueur2_id bigint,
    club_id bigint,
    minute integer NOT NULL,
    minute_additionnelle integer DEFAULT 0 NOT NULL,
    periode character varying(255) NOT NULL,
    details character varying(255),
    statut character varying(255) DEFAULT 'publie'::character varying NOT NULL,
    timestamp_reel timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_event_minute CHECK (((minute >= 0) AND (minute <= 130))),
    CONSTRAINT chk_event_minute_add CHECK (((minute_additionnelle >= 0) AND (minute_additionnelle <= 20))),
    CONSTRAINT match_events_periode_check CHECK (((periode)::text = ANY ((ARRAY['mi_temps_1'::character varying, 'mi_temps_2'::character varying, 'prolongation_1'::character varying, 'prolongation_2'::character varying, 'tab'::character varying])::text[]))),
    CONSTRAINT match_events_statut_check CHECK (((statut)::text = ANY ((ARRAY['publie'::character varying, 'conteste'::character varying, 'corrige'::character varying, 'annule'::character varying])::text[]))),
    CONSTRAINT match_events_type_check CHECK (((type)::text = ANY ((ARRAY['but'::character varying, 'but_csc'::character varying, 'but_penalite'::character varying, 'carton_jaune'::character varying, 'carton_rouge'::character varying, 'carton_rouge_direct'::character varying, 'remplacement'::character varying, 'penalty_rate'::character varying, 'debut_mi_temps'::character varying, 'fin_mi_temps'::character varying, 'debut_prolongation'::character varying, 'fin_prolongation'::character varying, 'debut_tab'::character varying, 'fin_tab'::character varying, 'incident'::character varying, 'interruption'::character varying])::text[])))
);


ALTER TABLE public.match_events OWNER TO postgres;

--
-- Name: match_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_events_id_seq OWNER TO postgres;

--
-- Name: match_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_events_id_seq OWNED BY public.match_events.id;


--
-- Name: matchs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matchs (
    id bigint NOT NULL,
    phase_id bigint NOT NULL,
    poule_id bigint,
    journee integer,
    club_domicile_id bigint NOT NULL,
    club_exterieur_id bigint NOT NULL,
    commissaire_id bigint,
    arbitre_principal_id bigint,
    date_heure timestamp(0) without time zone NOT NULL,
    stade character varying(150),
    terrain_neutre boolean DEFAULT false NOT NULL,
    type character varying(255) DEFAULT 'regulier'::character varying NOT NULL,
    score_domicile_terrain integer,
    score_exterieur_terrain integer,
    score_domicile_officiel integer,
    score_exterieur_officiel integer,
    type_resultat character varying(255),
    score_prolongation_dom integer,
    score_prolongation_ext integer,
    score_tab_dom integer,
    score_tab_ext integer,
    statut character varying(255) DEFAULT 'programme'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_differents_clubs CHECK ((club_domicile_id <> club_exterieur_id)),
    CONSTRAINT chk_scores_officiels_positifs CHECK ((((score_domicile_officiel IS NULL) OR (score_domicile_officiel >= 0)) AND ((score_exterieur_officiel IS NULL) OR (score_exterieur_officiel >= 0)))),
    CONSTRAINT chk_scores_tab_positifs CHECK ((((score_tab_dom IS NULL) OR (score_tab_dom >= 0)) AND ((score_tab_ext IS NULL) OR (score_tab_ext >= 0)))),
    CONSTRAINT chk_scores_terrain_positifs CHECK ((((score_domicile_terrain IS NULL) OR (score_domicile_terrain >= 0)) AND ((score_exterieur_terrain IS NULL) OR (score_exterieur_terrain >= 0)))),
    CONSTRAINT chk_tapis_vert_score CHECK ((((type_resultat)::text IS DISTINCT FROM 'tapis_vert'::text) OR ((score_domicile_officiel IS NOT NULL) AND (score_exterieur_officiel IS NOT NULL)))),
    CONSTRAINT matchs_statut_check CHECK (((statut)::text = ANY ((ARRAY['programme'::character varying, 'en_cours'::character varying, 'termine'::character varying, 'reporte'::character varying, 'annule'::character varying, 'suspendu'::character varying])::text[]))),
    CONSTRAINT matchs_type_check CHECK (((type)::text = ANY ((ARRAY['regulier'::character varying, 'playoff'::character varying, 'barrage'::character varying, 'report'::character varying])::text[]))),
    CONSTRAINT matchs_type_resultat_check CHECK (((type_resultat)::text = ANY ((ARRAY['normal'::character varying, 'forfait'::character varying, 'tapis_vert'::character varying])::text[])))
);


ALTER TABLE public.matchs OWNER TO postgres;

--
-- Name: matchs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.matchs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matchs_id_seq OWNER TO postgres;

--
-- Name: matchs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.matchs_id_seq OWNED BY public.matchs.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: mobile_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mobile_users (
    id bigint NOT NULL,
    id_anonyme character varying(100) NOT NULL,
    pseudo character varying(50),
    club_favori_id bigint,
    token_fcm character varying(255),
    locale character varying(10) DEFAULT 'fr'::character varying NOT NULL,
    date_premiere_visite timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    derniere_activite timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_mobile_user_pseudo CHECK (((pseudo IS NULL) OR ((length((pseudo)::text) >= 3) AND (length((pseudo)::text) <= 30))))
);


ALTER TABLE public.mobile_users OWNER TO postgres;

--
-- Name: mobile_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mobile_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mobile_users_id_seq OWNER TO postgres;

--
-- Name: mobile_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mobile_users_id_seq OWNED BY public.mobile_users.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    mobile_user_id bigint NOT NULL,
    match_event_id bigint,
    type character varying(255) NOT NULL,
    titre character varying(100) NOT NULL,
    message character varying(255) NOT NULL,
    statut character varying(255) DEFAULT 'envoyee'::character varying NOT NULL,
    fcm_message_id character varying(255),
    date_envoi timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_lecture timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT notifications_statut_check CHECK (((statut)::text = ANY ((ARRAY['envoyee'::character varying, 'lue'::character varying, 'echouee'::character varying])::text[]))),
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['but'::character varying, 'carton'::character varying, 'coup_envoi'::character varying, 'mi_temps'::character varying, 'score_final'::character varying, 'transfert'::character varying, 'article'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: penalites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penalites (
    id bigint NOT NULL,
    club_id bigint NOT NULL,
    saison_id bigint NOT NULL,
    admin_id bigint NOT NULL,
    match_id bigint,
    type character varying(255) NOT NULL,
    points_retires integer DEFAULT 0 NOT NULL,
    motif text NOT NULL,
    date_application timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    est_appliquee boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_penalite_points CHECK ((points_retires >= 0)),
    CONSTRAINT penalites_type_check CHECK (((type)::text = ANY ((ARRAY['retrait_points'::character varying, 'tapis_vert'::character varying, 'amende'::character varying, 'huis_clos'::character varying, 'suspension'::character varying])::text[])))
);


ALTER TABLE public.penalites OWNER TO postgres;

--
-- Name: penalites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penalites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penalites_id_seq OWNER TO postgres;

--
-- Name: penalites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penalites_id_seq OWNED BY public.penalites.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO postgres;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO postgres;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: phases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phases (
    id bigint NOT NULL,
    saison_id bigint NOT NULL,
    nom character varying(100) NOT NULL,
    type character varying(255) NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    date_debut date,
    date_fin date,
    statut character varying(255) DEFAULT 'planifiee'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT phases_statut_check CHECK (((statut)::text = ANY ((ARRAY['planifiee'::character varying, 'en_cours'::character varying, 'terminee'::character varying])::text[]))),
    CONSTRAINT phases_type_check CHECK (((type)::text = ANY ((ARRAY['reguliere'::character varying, 'playoff_up'::character varying, 'playoff_down'::character varying, 'barrage'::character varying, 'coupe'::character varying])::text[])))
);


ALTER TABLE public.phases OWNER TO postgres;

--
-- Name: phases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phases_id_seq OWNER TO postgres;

--
-- Name: phases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phases_id_seq OWNED BY public.phases.id;


--
-- Name: poules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poules (
    id bigint NOT NULL,
    phase_id bigint NOT NULL,
    nom character varying(10) NOT NULL,
    nb_equipes integer DEFAULT 8 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.poules OWNER TO postgres;

--
-- Name: poules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.poules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poules_id_seq OWNER TO postgres;

--
-- Name: poules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.poules_id_seq OWNED BY public.poules.id;


--
-- Name: prediction_matchs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prediction_matchs (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    proba_victoire_dom numeric(5,2) NOT NULL,
    proba_nul numeric(5,2) NOT NULL,
    proba_victoire_ext numeric(5,2) NOT NULL,
    terrain_neutre boolean NOT NULL,
    phase_competition character varying(50) NOT NULL,
    modele_version character varying(20) NOT NULL,
    date_calcul timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_prediction_probas_range CHECK ((((proba_victoire_dom >= (0)::numeric) AND (proba_victoire_dom <= (100)::numeric)) AND ((proba_nul >= (0)::numeric) AND (proba_nul <= (100)::numeric)) AND ((proba_victoire_ext >= (0)::numeric) AND (proba_victoire_ext <= (100)::numeric)))),
    CONSTRAINT chk_prediction_probas_somme CHECK ((abs((((proba_victoire_dom + proba_nul) + proba_victoire_ext) - 100.00)) < 0.01))
);


ALTER TABLE public.prediction_matchs OWNER TO postgres;

--
-- Name: prediction_matchs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prediction_matchs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prediction_matchs_id_seq OWNER TO postgres;

--
-- Name: prediction_matchs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prediction_matchs_id_seq OWNED BY public.prediction_matchs.id;


--
-- Name: regles_saisons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regles_saisons (
    id bigint NOT NULL,
    saison_id bigint NOT NULL,
    nb_equipes integer DEFAULT 16 NOT NULL,
    nb_poules integer DEFAULT 1 NOT NULL,
    relegations_directes integer DEFAULT 4 NOT NULL,
    barrages integer DEFAULT 0 NOT NULL,
    places_ligue_champions integer DEFAULT 1 NOT NULL,
    places_coupe_caf integer DEFAULT 1 NOT NULL,
    criteres_egalite jsonb DEFAULT '["confrontations_directes", "goal_average_general", "buts_marques", "fair_play"]'::jsonb NOT NULL,
    points_reportes_playoff boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_regles_nb_equipes CHECK ((nb_equipes > 0))
);


ALTER TABLE public.regles_saisons OWNER TO postgres;

--
-- Name: regles_saisons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.regles_saisons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.regles_saisons_id_seq OWNER TO postgres;

--
-- Name: regles_saisons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.regles_saisons_id_seq OWNED BY public.regles_saisons.id;


--
-- Name: saisons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saisons (
    id bigint NOT NULL,
    competition_id bigint NOT NULL,
    intitule character varying(255) NOT NULL,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    nb_journees integer DEFAULT 0 NOT NULL,
    statut character varying(255) DEFAULT 'planifiee'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_saison_dates CHECK ((date_fin > date_debut)),
    CONSTRAINT chk_saison_journees CHECK ((nb_journees >= 0)),
    CONSTRAINT saisons_statut_check CHECK (((statut)::text = ANY ((ARRAY['planifiee'::character varying, 'en_cours'::character varying, 'suspendue'::character varying, 'terminee'::character varying])::text[])))
);


ALTER TABLE public.saisons OWNER TO postgres;

--
-- Name: saisons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saisons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saisons_id_seq OWNER TO postgres;

--
-- Name: saisons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saisons_id_seq OWNED BY public.saisons.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: stat_joueurs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stat_joueurs (
    id bigint NOT NULL,
    joueur_id bigint NOT NULL,
    saison_id bigint NOT NULL,
    club_id bigint NOT NULL,
    buts integer DEFAULT 0 NOT NULL,
    passes_decisives integer DEFAULT 0 NOT NULL,
    cartons_jaunes integer DEFAULT 0 NOT NULL,
    cartons_rouges integer DEFAULT 0 NOT NULL,
    minutes_jouees integer DEFAULT 0 NOT NULL,
    nb_matchs integer DEFAULT 0 NOT NULL,
    nb_titularisations integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_cartons_rouges_coherents CHECK ((cartons_rouges <= nb_matchs)),
    CONSTRAINT chk_stats_positives CHECK (((buts >= 0) AND (passes_decisives >= 0) AND (cartons_jaunes >= 0) AND (cartons_rouges >= 0) AND (minutes_jouees >= 0) AND (nb_matchs >= 0)))
);


ALTER TABLE public.stat_joueurs OWNER TO postgres;

--
-- Name: stat_joueurs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stat_joueurs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stat_joueurs_id_seq OWNER TO postgres;

--
-- Name: stat_joueurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stat_joueurs_id_seq OWNED BY public.stat_joueurs.id;


--
-- Name: talent_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.talent_scores (
    id bigint NOT NULL,
    joueur_id bigint NOT NULL,
    score_global numeric(5,2) NOT NULL,
    score_offensif numeric(5,2) NOT NULL,
    score_defensif numeric(5,2) NOT NULL,
    score_discipline numeric(5,2) NOT NULL,
    score_regularite numeric(5,2) NOT NULL,
    modele_version character varying(20) NOT NULL,
    date_calcul timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_talent_scores_range CHECK ((((score_global >= (0)::numeric) AND (score_global <= (100)::numeric)) AND ((score_offensif >= (0)::numeric) AND (score_offensif <= (100)::numeric)) AND ((score_defensif >= (0)::numeric) AND (score_defensif <= (100)::numeric)) AND ((score_discipline >= (0)::numeric) AND (score_discipline <= (100)::numeric)) AND ((score_regularite >= (0)::numeric) AND (score_regularite <= (100)::numeric))))
);


ALTER TABLE public.talent_scores OWNER TO postgres;

--
-- Name: talent_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.talent_scores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.talent_scores_id_seq OWNER TO postgres;

--
-- Name: talent_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.talent_scores_id_seq OWNED BY public.talent_scores.id;


--
-- Name: transferts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transferts (
    id bigint NOT NULL,
    joueur_id bigint NOT NULL,
    club_cedant_id bigint NOT NULL,
    club_receveur_id bigint NOT NULL,
    saison_id bigint NOT NULL,
    valide_par bigint,
    montant numeric(12,2),
    type character varying(255) NOT NULL,
    statut character varying(255) DEFAULT 'en_attente'::character varying NOT NULL,
    date_demande timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_validation timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_transfert_clubs_differents CHECK ((club_cedant_id <> club_receveur_id)),
    CONSTRAINT chk_transfert_montant CHECK (((montant IS NULL) OR (montant >= (0)::numeric))),
    CONSTRAINT transferts_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_attente'::character varying, 'valide'::character varying, 'rejete'::character varying, 'annule'::character varying])::text[]))),
    CONSTRAINT transferts_type_check CHECK (((type)::text = ANY ((ARRAY['definitif'::character varying, 'pret'::character varying, 'pret_avec_option'::character varying])::text[])))
);


ALTER TABLE public.transferts OWNER TO postgres;

--
-- Name: transferts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transferts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transferts_id_seq OWNER TO postgres;

--
-- Name: transferts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transferts_id_seq OWNED BY public.transferts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    mot_de_passe character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    statut character varying(255) DEFAULT 'actif'::character varying NOT NULL,
    derniere_connexion timestamp(0) without time zone,
    ip_derniere_connexion character varying(45),
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT chk_user_email_format CHECK (((email)::text ~~ '%@%'::text)),
    CONSTRAINT chk_user_role CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'responsable_club'::character varying, 'coach'::character varying, 'commissaire'::character varying, 'journaliste'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'responsable_club'::character varying, 'coach'::character varying, 'commissaire'::character varying, 'journaliste'::character varying])::text[]))),
    CONSTRAINT users_statut_check CHECK (((statut)::text = ANY ((ARRAY['actif'::character varying, 'suspendu'::character varying, 'inactif'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.votes (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    mobile_user_id bigint NOT NULL,
    type character varying(255) NOT NULL,
    valeur character varying(50) NOT NULL,
    timestamp_vote timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT votes_type_check CHECK (((type)::text = ANY ((ARRAY['pronostic'::character varying, 'homme_du_match'::character varying])::text[])))
);


ALTER TABLE public.votes OWNER TO postgres;

--
-- Name: votes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.votes_id_seq OWNER TO postgres;

--
-- Name: votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.votes_id_seq OWNED BY public.votes.id;


--
-- Name: arbitres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arbitres ALTER COLUMN id SET DEFAULT nextval('public.arbitres_id_seq'::regclass);


--
-- Name: articles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: classements_clubs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classements_clubs ALTER COLUMN id SET DEFAULT nextval('public.classements_clubs_id_seq'::regclass);


--
-- Name: club_poule id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_poule ALTER COLUMN id SET DEFAULT nextval('public.club_poule_id_seq'::regclass);


--
-- Name: clubs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clubs ALTER COLUMN id SET DEFAULT nextval('public.clubs_id_seq'::regclass);


--
-- Name: commentaires id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentaires ALTER COLUMN id SET DEFAULT nextval('public.commentaires_id_seq'::regclass);


--
-- Name: competitions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitions ALTER COLUMN id SET DEFAULT nextval('public.competitions_id_seq'::regclass);


--
-- Name: composition_joueurs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.composition_joueurs ALTER COLUMN id SET DEFAULT nextval('public.composition_joueurs_id_seq'::regclass);


--
-- Name: compositions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compositions ALTER COLUMN id SET DEFAULT nextval('public.compositions_id_seq'::regclass);


--
-- Name: contestations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contestations ALTER COLUMN id SET DEFAULT nextval('public.contestations_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: feuilles_de_match id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feuilles_de_match ALTER COLUMN id SET DEFAULT nextval('public.feuilles_de_match_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: joueurs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.joueurs ALTER COLUMN id SET DEFAULT nextval('public.joueurs_id_seq'::regclass);


--
-- Name: match_arbitres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_arbitres ALTER COLUMN id SET DEFAULT nextval('public.match_arbitres_id_seq'::regclass);


--
-- Name: match_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events ALTER COLUMN id SET DEFAULT nextval('public.match_events_id_seq'::regclass);


--
-- Name: matchs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matchs ALTER COLUMN id SET DEFAULT nextval('public.matchs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: mobile_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mobile_users ALTER COLUMN id SET DEFAULT nextval('public.mobile_users_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: penalites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalites ALTER COLUMN id SET DEFAULT nextval('public.penalites_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: phases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phases ALTER COLUMN id SET DEFAULT nextval('public.phases_id_seq'::regclass);


--
-- Name: poules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poules ALTER COLUMN id SET DEFAULT nextval('public.poules_id_seq'::regclass);


--
-- Name: prediction_matchs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prediction_matchs ALTER COLUMN id SET DEFAULT nextval('public.prediction_matchs_id_seq'::regclass);


--
-- Name: regles_saisons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regles_saisons ALTER COLUMN id SET DEFAULT nextval('public.regles_saisons_id_seq'::regclass);


--
-- Name: saisons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saisons ALTER COLUMN id SET DEFAULT nextval('public.saisons_id_seq'::regclass);


--
-- Name: stat_joueurs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_joueurs ALTER COLUMN id SET DEFAULT nextval('public.stat_joueurs_id_seq'::regclass);


--
-- Name: talent_scores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.talent_scores ALTER COLUMN id SET DEFAULT nextval('public.talent_scores_id_seq'::regclass);


--
-- Name: transferts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferts ALTER COLUMN id SET DEFAULT nextval('public.transferts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: votes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes ALTER COLUMN id SET DEFAULT nextval('public.votes_id_seq'::regclass);


--
-- Data for Name: arbitres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.arbitres (id, nom, prenom, num_licence, poste, specification, region, est_actif, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articles (id, journaliste_id, valide_par, titre, contenu, image_url, categorie, statut, motif_rejet, date_soumission, date_publication, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entite_concernee, entite_id, anciennes_valeurs, nouvelles_valeurs, ip_adresse, user_agent, "timestamp") FROM stdin;
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache (key, value, expiration) FROM stdin;
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: classements_clubs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classements_clubs (id, club_id, phase_id, poule_id, points, victoires, nuls, defaites, buts_pour, buts_contre, diff_buts, cartons_jaunes, cartons_rouges, points_penalite, "position", created_at, updated_at) FROM stdin;
1	1	1	\N	65	19	8	3	55	24	31	0	0	0	1	2026-05-30 18:43:00	2026-05-30 18:43:00
2	2	1	\N	55	17	4	9	47	32	15	0	0	0	2	2026-05-30 18:43:00	2026-05-30 18:43:00
3	3	1	\N	53	16	5	9	58	31	27	0	0	0	3	2026-05-30 18:43:00	2026-05-30 18:43:00
4	4	1	\N	52	15	7	8	44	25	19	0	0	0	4	2026-05-30 18:43:00	2026-05-30 18:43:00
5	5	1	\N	43	12	7	11	37	35	2	0	0	0	5	2026-05-30 18:43:00	2026-05-30 18:43:00
6	6	1	\N	42	12	6	12	35	42	-7	0	0	0	6	2026-05-30 18:43:00	2026-05-30 18:43:00
7	7	1	\N	41	11	8	11	38	35	3	0	0	0	7	2026-05-30 18:43:00	2026-05-30 18:43:00
8	8	1	\N	39	10	9	11	32	29	3	0	0	0	8	2026-05-30 18:43:00	2026-05-30 18:43:00
9	9	1	\N	39	10	9	11	30	28	2	0	0	0	9	2026-05-30 18:43:00	2026-05-30 18:43:00
10	10	1	\N	39	10	9	11	31	34	-3	0	0	0	10	2026-05-30 18:43:00	2026-05-30 18:43:00
11	11	1	\N	38	10	8	12	34	38	-4	0	0	0	11	2026-05-30 18:43:00	2026-05-30 18:43:00
12	12	1	\N	37	10	7	13	32	33	-1	0	0	0	12	2026-05-30 18:43:00	2026-05-30 18:43:00
13	13	1	\N	36	9	9	12	31	38	-7	0	0	0	13	2026-05-30 18:43:00	2026-05-30 18:43:00
14	14	1	\N	33	8	9	13	26	43	-17	0	0	0	14	2026-05-30 18:43:00	2026-05-30 18:43:00
15	15	1	\N	22	5	7	18	21	55	-34	0	0	0	15	2026-05-30 18:43:00	2026-05-30 18:43:00
16	16	1	\N	0	0	0	0	0	0	0	0	0	0	16	2026-05-30 18:43:00	2026-05-30 18:43:00
17	17	3	\N	29	9	2	3	24	16	8	0	0	0	1	2026-05-30 18:43:00	2026-05-30 18:43:00
18	18	3	\N	23	6	5	3	25	21	4	0	0	0	2	2026-05-30 18:43:00	2026-05-30 18:43:00
19	19	3	\N	22	7	1	6	18	19	-1	0	0	0	3	2026-05-30 18:43:00	2026-05-30 18:43:00
20	20	3	\N	21	6	3	5	21	14	7	0	0	0	4	2026-05-30 18:43:00	2026-05-30 18:43:00
21	21	3	\N	20	5	5	4	26	19	7	0	0	0	5	2026-05-30 18:43:00	2026-05-30 18:43:00
22	22	3	\N	20	4	8	2	12	7	5	0	0	0	6	2026-05-30 18:43:00	2026-05-30 18:43:00
23	23	3	\N	13	3	4	7	14	25	-11	0	0	0	7	2026-05-30 18:43:00	2026-05-30 18:43:00
24	24	3	\N	3	0	3	15	15	43	-28	0	0	0	8	2026-05-30 18:43:00	2026-05-30 18:43:00
25	25	4	\N	28	9	1	6	17	11	6	0	0	3	1	2026-05-30 18:43:00	2026-05-30 18:43:00
26	26	4	\N	26	8	2	6	21	15	6	0	0	0	2	2026-05-30 18:43:00	2026-05-30 18:43:00
27	27	4	\N	25	7	4	5	20	14	6	0	0	0	3	2026-05-30 18:43:00	2026-05-30 18:43:00
28	28	4	\N	25	7	4	5	18	17	1	0	0	0	4	2026-05-30 18:43:00	2026-05-30 18:43:00
29	29	4	\N	22	6	4	6	22	20	2	0	0	0	5	2026-05-30 18:43:00	2026-05-30 18:43:00
30	30	4	\N	20	5	5	6	18	19	-1	0	0	0	6	2026-05-30 18:43:00	2026-05-30 18:43:00
31	31	4	\N	19	4	7	5	14	16	-2	0	0	0	7	2026-05-30 18:43:00	2026-05-30 18:43:00
32	32	4	\N	15	3	6	7	13	18	-5	0	0	0	8	2026-05-30 18:43:00	2026-05-30 18:43:00
\.


--
-- Data for Name: club_poule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.club_poule (id, club_id, poule_id, saison_id, date_affectation, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clubs (id, nom, ville, stade, logo_url, couleurs, division, annee_creation, president, est_actif, responsable_id, created_at, updated_at) FROM stdin;
1	Colombe Sportive du Dja et Lobo	Sangmélima	Stade Municipal de Sangmélima	\N	Blanc et Vert	elite_one	1974	\N	t	2	2026-05-30 18:42:59	2026-05-30 18:42:59
2	Panthère Sportive du Ndé	Bangangté	Stade de Bangangté	\N	Jaune et Noir	elite_one	1968	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
3	Gazelle FA de Garoua	Garoua	Stade Omnisports Roumdé Adjia	\N	Orange et Noir	elite_one	1999	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
4	Coton Sport de Garoua	Garoua	Stade Omnisports Roumdé Adjia	\N	Bleu et Blanc	elite_one	1986	\N	t	3	2026-05-30 18:42:59	2026-05-30 18:42:59
5	Stade Renard de Melong	Melong	Stade de Melong	\N	Rouge et Blanc	elite_one	1960	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
6	Victoria United	Limbé	Stade de Buea	\N	Vert et Blanc	elite_one	2010	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
7	Canon Sportif de Yaoundé	Yaoundé	Stade Ahmadou Ahidjo	\N	Vert et Rouge	elite_one	1930	\N	t	4	2026-05-30 18:42:59	2026-05-30 18:42:59
8	Fauves Azur Elite	Douala	Stade de la Réunification	\N	Bleu et Blanc	elite_one	2012	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
9	PWD Social Club de Bamenda	Bamenda	Stade de Bamenda	\N	Rouge et Blanc	elite_one	1952	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
10	Aigle Royal de Moungo	Nkongsamba	Stade de Nkongsamba	\N	Blanc et Rouge	elite_one	1980	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
11	Dynamo FC de Douala	Douala	Stade de Bépanda	\N	Jaune et Bleu	elite_one	1958	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
12	AS Fortuna de Mfou	Mfou	Stade de Mfou	\N	Violet et Blanc	elite_one	1998	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
13	Bamboutos FC de Mbouda	Mbouda	Stade de Mbouda	\N	Bleu et Blanc	elite_one	1998	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
14	Les Astres de Douala	Douala	Stade de Bépanda	\N	Vert et Blanc	elite_two	2000	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
15	Union Sportive de Douala	Douala	Stade de la Réunification	\N	Rouge et Blanc	elite_two	1934	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
16	Yong Sport Academy	Bamenda	Stade de Bamenda	\N	Vert et Jaune	regionale	2010	\N	t	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
17	Avion Academy	Douala	Stade de Bépanda	\N	Bleu et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
18	Unisport Bafang	Bafang	Stade de Bafang	\N	Rouge et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
19	Ngoketunjia FC	Ndop	Stade de Ndop	\N	Vert et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
20	Atlantic FC	Douala	Stade de la Réunification	\N	Bleu et Orange	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
21	APEJES Academy	Mfou	Stade de Mfou	\N	Vert et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
22	Bafoussam FC	Bafoussam	Stade de Kouékong	\N	Rouge et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
23	Yafoot FC	Yaoundé	Stade Omnisports Yaoundé	\N	Jaune et Noir	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
24	Dragon de Yaoundé	Yaoundé	Stade Omnisports Yaoundé	\N	Vert et Rouge	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
25	Eding Sport FC	Ndikinimeki	Stade de Ndikinimeki	\N	Vert et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
26	Bafmeng United	Bafmeng	Stade de Bafmeng	\N	Rouge et Noir	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
27	Aigle Royal	Yaoundé	Stade Omnisports Yaoundé	\N	Rouge et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
28	Tonnerre KC	Yaoundé	Stade Ahmadou Ahidjo	\N	Jaune et Noir	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
29	Isohsa FC	Buea	Stade de Buea	\N	Vert et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
30	AS Fap	Yaoundé	Stade Militaire	\N	Blanc et Bleu	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
31	Union SA	Yaoundé	Stade Omnisports Yaoundé	\N	Vert et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
32	Fovu Baham	Baham	Stade de Baham	\N	Rouge et Blanc	elite_two	\N	\N	t	\N	2026-05-30 18:43:00	2026-05-30 18:43:00
\.


--
-- Data for Name: commentaires; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commentaires (id, match_id, mobile_user_id, pseudo, texte, statut, timestamp_commentaire, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: competitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.competitions (id, nom, niveau, pays, organisateur, sponsor_titre, est_active, created_at, updated_at) FROM stdin;
1	MTN Elite One	elite_one	Cameroun	FECAFOOT	MTN Cameroun	t	2026-05-30 18:42:59	2026-05-30 18:42:59
2	MTN Elite Two	elite_two	Cameroun	FECAFOOT	MTN Cameroun	t	2026-05-30 18:42:59	2026-05-30 18:42:59
\.


--
-- Data for Name: composition_joueurs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.composition_joueurs (id, composition_id, joueur_id, est_titulaire, est_capitaine, minute_entree, minute_sortie, numero_maillot_match, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: compositions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compositions (id, match_id, club_id, soumis_par, statut, est_confirmee, date_soumission, date_confirmation, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contestations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contestations (id, match_event_id, coach_id, match_id, motif, statut, decision, traitee_par, date_contestation, date_decision, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: feuilles_de_match; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feuilles_de_match (id, match_id, score_final_domicile, score_final_exterieur, rapport_incidents, statut, date_generation, date_soumission, date_validation, valide_par, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: joueurs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.joueurs (id, club_id, nom, prenom, date_naissance, nationalite, poste, num_maillot, num_licence, statut, photo_url, taille_cm, poids_kg, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: match_arbitres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_arbitres (id, match_id, arbitre_id, role, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: match_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_events (id, match_id, type, joueur_id, joueur2_id, club_id, minute, minute_additionnelle, periode, details, statut, timestamp_reel, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: matchs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matchs (id, phase_id, poule_id, journee, club_domicile_id, club_exterieur_id, commissaire_id, arbitre_principal_id, date_heure, stade, terrain_neutre, type, score_domicile_terrain, score_exterieur_terrain, score_domicile_officiel, score_exterieur_officiel, type_resultat, score_prolongation_dom, score_prolongation_ext, score_tab_dom, score_tab_ext, statut, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000001_create_cache_table	1
2	0001_01_01_000002_create_jobs_table	1
3	2026_05_30_005648_create_personal_access_tokens_table	1
4	2026_05_30_014627_create_users_table	1
5	2026_05_30_014630_create_competitions_table	1
6	2026_05_30_014631_create_saisons_table	1
7	2026_05_30_014632_create_clubs_table	1
8	2026_05_30_014632_create_regles_saisons_table	1
9	2026_05_30_014633_create_arbitres_table	1
10	2026_05_30_014634_create_phases_table	1
11	2026_05_30_014634_create_poules_table	1
12	2026_05_30_014635_create_club_poule_table	1
13	2026_05_30_014636_create_joueurs_table	1
14	2026_05_30_014636_create_stat_joueurs_table	1
15	2026_05_30_014637_create_talent_scores_table	1
16	2026_05_30_014638_create_matchs_table	1
17	2026_05_30_014639_create_match_arbitres_table	1
18	2026_05_30_014639_create_match_events_table	1
19	2026_05_30_014640_create_feuilles_de_match_table	1
20	2026_05_30_014641_create_compositions_table	1
21	2026_05_30_014643_create_classements_clubs_table	1
22	2026_05_30_014643_create_composition_joueurs_table	1
23	2026_05_30_014644_create_prediction_matchs_table	1
24	2026_05_30_014645_create_penalites_table	1
25	2026_05_30_014645_create_transferts_table	1
26	2026_05_30_014646_create_articles_table	1
27	2026_05_30_014646_create_contestations_table	1
28	2026_05_30_014647_create_mobile_users_table	1
29	2026_05_30_014648_create_commentaires_table	1
30	2026_05_30_014648_create_votes_table	1
31	2026_05_30_014649_create_notifications_table	1
32	2026_05_30_014650_create_audit_logs_table	1
\.


--
-- Data for Name: mobile_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mobile_users (id, id_anonyme, pseudo, club_favori_id, token_fcm, locale, date_premiere_visite, derniere_activite, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, mobile_user_id, match_event_id, type, titre, message, statut, fcm_message_id, date_envoi, date_lecture, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: penalites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penalites (id, club_id, saison_id, admin_id, match_id, type, points_retires, motif, date_application, est_appliquee, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: phases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phases (id, saison_id, nom, type, ordre, date_debut, date_fin, statut, created_at, updated_at) FROM stdin;
1	1	Saison Régulière	reguliere	1	2024-09-27	2025-07-07	terminee	2026-05-30 18:43:00	2026-05-30 18:43:00
2	2	Phase Régulière	reguliere	1	2024-12-14	2025-04-30	terminee	2026-05-30 18:43:00	2026-05-30 18:43:00
3	2	Playoffs — Groupe Championnat	playoff_up	2	2025-05-01	2025-07-01	terminee	2026-05-30 18:43:00	2026-05-30 18:43:00
4	2	Playoffs — Groupe Relégation	playoff_down	3	2025-05-01	2025-07-01	terminee	2026-05-30 18:43:00	2026-05-30 18:43:00
\.


--
-- Data for Name: poules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.poules (id, phase_id, nom, nb_equipes, created_at, updated_at) FROM stdin;
1	2	Groupe A	8	2026-05-30 18:43:00	2026-05-30 18:43:00
2	2	Groupe B	8	2026-05-30 18:43:00	2026-05-30 18:43:00
\.


--
-- Data for Name: prediction_matchs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prediction_matchs (id, match_id, proba_victoire_dom, proba_nul, proba_victoire_ext, terrain_neutre, phase_competition, modele_version, date_calcul, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: regles_saisons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.regles_saisons (id, saison_id, nb_equipes, nb_poules, relegations_directes, barrages, places_ligue_champions, places_coupe_caf, criteres_egalite, points_reportes_playoff, created_at, updated_at) FROM stdin;
1	1	16	1	4	0	2	1	["confrontations_directes", "goal_average_general", "buts_marques", "fair_play"]	f	2026-05-30 18:42:59	2026-05-30 18:42:59
2	2	16	2	2	0	0	0	["goal_average_general", "buts_marques", "fair_play"]	f	2026-05-30 18:42:59	2026-05-30 18:42:59
\.


--
-- Data for Name: saisons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saisons (id, competition_id, intitule, date_debut, date_fin, nb_journees, statut, created_at, updated_at) FROM stdin;
1	1	MTN Elite One 2024-2025	2024-09-27	2025-07-07	30	terminee	2026-05-30 18:42:59	2026-05-30 18:42:59
2	2	MTN Elite Two 2024-2025	2024-12-14	2025-07-01	18	terminee	2026-05-30 18:42:59	2026-05-30 18:42:59
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
\.


--
-- Data for Name: stat_joueurs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stat_joueurs (id, joueur_id, saison_id, club_id, buts, passes_decisives, cartons_jaunes, cartons_rouges, minutes_jouees, nb_matchs, nb_titularisations, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: talent_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.talent_scores (id, joueur_id, score_global, score_offensif, score_defensif, score_discipline, score_regularite, modele_version, date_calcul, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transferts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transferts (id, joueur_id, club_cedant_id, club_receveur_id, saison_id, valide_par, montant, type, statut, date_demande, date_validation, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, mot_de_passe, role, statut, derniere_connexion, ip_derniere_connexion, remember_token, created_at, updated_at) FROM stdin;
1	admin@fecafoot.cm	$2y$12$RvtU1D/NpfgYppALKcOYoepuB3NgZYxCam7.An/7.uy7wb5T02FGS	admin	actif	\N	\N	\N	2026-05-30 18:42:57	2026-05-30 18:42:57
2	resp@colombe-sportive.cm	$2y$12$UxzoVkk9cIQh0ces.rxS6O6C1Q8d4fj57ytg6eG.htnCGpiRkzkoG	responsable_club	actif	\N	\N	\N	2026-05-30 18:42:57	2026-05-30 18:42:57
3	resp@coton-sport.cm	$2y$12$9VgvDHvGGw6BBrEap9ZlY.jOb821VQYFU47V5kCvvAGTiBj4F/R5e	responsable_club	actif	\N	\N	\N	2026-05-30 18:42:58	2026-05-30 18:42:58
4	resp@canon-yaounde.cm	$2y$12$kvw../s719RN8HZxbrXQxeOFFovLfy7xxC059XiHrn8TWCigPjOSO	responsable_club	actif	\N	\N	\N	2026-05-30 18:42:58	2026-05-30 18:42:58
5	journaliste@camfoot.cm	$2y$12$ysuplttwdK1ZO8xDyqwFL.wupCtSUGRVMyxQyB7NYPAB5iFZsp3za	journaliste	actif	\N	\N	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
6	commissaire1@fecafoot.cm	$2y$12$BSaZkMI1wNWe/QKDdHOD3Ol5Cx65qHYBN15FDa96KLPyLORxnC9UC	commissaire	actif	\N	\N	\N	2026-05-30 18:42:59	2026-05-30 18:42:59
\.


--
-- Data for Name: votes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.votes (id, match_id, mobile_user_id, type, valeur, timestamp_vote, created_at, updated_at) FROM stdin;
\.


--
-- Name: arbitres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.arbitres_id_seq', 1, false);


--
-- Name: articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.articles_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: classements_clubs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classements_clubs_id_seq', 32, true);


--
-- Name: club_poule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.club_poule_id_seq', 1, false);


--
-- Name: clubs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clubs_id_seq', 32, true);


--
-- Name: commentaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.commentaires_id_seq', 1, false);


--
-- Name: competitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.competitions_id_seq', 2, true);


--
-- Name: composition_joueurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.composition_joueurs_id_seq', 1, false);


--
-- Name: compositions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compositions_id_seq', 1, false);


--
-- Name: contestations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contestations_id_seq', 1, false);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: feuilles_de_match_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feuilles_de_match_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: joueurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.joueurs_id_seq', 1, false);


--
-- Name: match_arbitres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_arbitres_id_seq', 1, false);


--
-- Name: match_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_events_id_seq', 1, false);


--
-- Name: matchs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.matchs_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 32, true);


--
-- Name: mobile_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mobile_users_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: penalites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penalites_id_seq', 1, false);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 1, false);


--
-- Name: phases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phases_id_seq', 4, true);


--
-- Name: poules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.poules_id_seq', 2, true);


--
-- Name: prediction_matchs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prediction_matchs_id_seq', 1, false);


--
-- Name: regles_saisons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.regles_saisons_id_seq', 2, true);


--
-- Name: saisons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saisons_id_seq', 2, true);


--
-- Name: stat_joueurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stat_joueurs_id_seq', 1, false);


--
-- Name: talent_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.talent_scores_id_seq', 1, false);


--
-- Name: transferts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transferts_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: votes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.votes_id_seq', 1, false);


--
-- Name: arbitres arbitres_num_licence_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arbitres
    ADD CONSTRAINT arbitres_num_licence_unique UNIQUE (num_licence);


--
-- Name: arbitres arbitres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arbitres
    ADD CONSTRAINT arbitres_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: classements_clubs classements_clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classements_clubs
    ADD CONSTRAINT classements_clubs_pkey PRIMARY KEY (id);


--
-- Name: club_poule club_poule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_poule
    ADD CONSTRAINT club_poule_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_nom_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_nom_unique UNIQUE (nom);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: commentaires commentaires_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentaires
    ADD CONSTRAINT commentaires_pkey PRIMARY KEY (id);


--
-- Name: competitions competitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_pkey PRIMARY KEY (id);


--
-- Name: composition_joueurs composition_joueurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.composition_joueurs
    ADD CONSTRAINT composition_joueurs_pkey PRIMARY KEY (id);


--
-- Name: compositions compositions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compositions
    ADD CONSTRAINT compositions_pkey PRIMARY KEY (id);


--
-- Name: contestations contestations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contestations
    ADD CONSTRAINT contestations_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: feuilles_de_match feuilles_de_match_match_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feuilles_de_match
    ADD CONSTRAINT feuilles_de_match_match_id_unique UNIQUE (match_id);


--
-- Name: feuilles_de_match feuilles_de_match_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feuilles_de_match
    ADD CONSTRAINT feuilles_de_match_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: joueurs joueurs_num_licence_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.joueurs
    ADD CONSTRAINT joueurs_num_licence_unique UNIQUE (num_licence);


--
-- Name: joueurs joueurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.joueurs
    ADD CONSTRAINT joueurs_pkey PRIMARY KEY (id);


--
-- Name: match_arbitres match_arbitres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_arbitres
    ADD CONSTRAINT match_arbitres_pkey PRIMARY KEY (id);


--
-- Name: match_events match_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_pkey PRIMARY KEY (id);


--
-- Name: matchs matchs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matchs
    ADD CONSTRAINT matchs_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: mobile_users mobile_users_id_anonyme_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mobile_users
    ADD CONSTRAINT mobile_users_id_anonyme_unique UNIQUE (id_anonyme);


--
-- Name: mobile_users mobile_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mobile_users
    ADD CONSTRAINT mobile_users_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: penalites penalites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalites
    ADD CONSTRAINT penalites_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: phases phases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phases
    ADD CONSTRAINT phases_pkey PRIMARY KEY (id);


--
-- Name: poules poules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poules
    ADD CONSTRAINT poules_pkey PRIMARY KEY (id);


--
-- Name: prediction_matchs prediction_matchs_match_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prediction_matchs
    ADD CONSTRAINT prediction_matchs_match_id_unique UNIQUE (match_id);


--
-- Name: prediction_matchs prediction_matchs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prediction_matchs
    ADD CONSTRAINT prediction_matchs_pkey PRIMARY KEY (id);


--
-- Name: regles_saisons regles_saisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regles_saisons
    ADD CONSTRAINT regles_saisons_pkey PRIMARY KEY (id);


--
-- Name: regles_saisons regles_saisons_saison_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regles_saisons
    ADD CONSTRAINT regles_saisons_saison_id_unique UNIQUE (saison_id);


--
-- Name: saisons saisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saisons
    ADD CONSTRAINT saisons_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: stat_joueurs stat_joueurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_joueurs
    ADD CONSTRAINT stat_joueurs_pkey PRIMARY KEY (id);


--
-- Name: talent_scores talent_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.talent_scores
    ADD CONSTRAINT talent_scores_pkey PRIMARY KEY (id);


--
-- Name: transferts transferts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferts
    ADD CONSTRAINT transferts_pkey PRIMARY KEY (id);


--
-- Name: classements_clubs uq_classement_club_phase_poule; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classements_clubs
    ADD CONSTRAINT uq_classement_club_phase_poule UNIQUE (club_id, phase_id, poule_id);


--
-- Name: club_poule uq_club_saison; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_poule
    ADD CONSTRAINT uq_club_saison UNIQUE (club_id, saison_id);


--
-- Name: composition_joueurs uq_compo_joueur; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.composition_joueurs
    ADD CONSTRAINT uq_compo_joueur UNIQUE (composition_id, joueur_id);


--
-- Name: compositions uq_composition_match_club; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compositions
    ADD CONSTRAINT uq_composition_match_club UNIQUE (match_id, club_id);


--
-- Name: match_arbitres uq_match_arbitre; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_arbitres
    ADD CONSTRAINT uq_match_arbitre UNIQUE (match_id, arbitre_id);


--
-- Name: match_arbitres uq_match_role_arbitre; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_arbitres
    ADD CONSTRAINT uq_match_role_arbitre UNIQUE (match_id, role);


--
-- Name: stat_joueurs uq_stats_joueur_saison_club; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_joueurs
    ADD CONSTRAINT uq_stats_joueur_saison_club UNIQUE (joueur_id, saison_id, club_id);


--
-- Name: votes uq_vote_fan_match_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT uq_vote_fan_match_type UNIQUE (match_id, mobile_user_id, type);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: arbitres_est_actif_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX arbitres_est_actif_index ON public.arbitres USING btree (est_actif);


--
-- Name: arbitres_poste_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX arbitres_poste_index ON public.arbitres USING btree (poste);


--
-- Name: articles_journaliste_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX articles_journaliste_id_index ON public.articles USING btree (journaliste_id);


--
-- Name: articles_statut_date_publication_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX articles_statut_date_publication_index ON public.articles USING btree (statut, date_publication);


--
-- Name: audit_logs_entite_concernee_entite_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_entite_concernee_entite_id_index ON public.audit_logs USING btree (entite_concernee, entite_id);


--
-- Name: audit_logs_timestamp_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_timestamp_index ON public.audit_logs USING btree ("timestamp");


--
-- Name: audit_logs_user_id_timestamp_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_user_id_timestamp_index ON public.audit_logs USING btree (user_id, "timestamp");


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: classements_clubs_phase_id_points_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX classements_clubs_phase_id_points_index ON public.classements_clubs USING btree (phase_id, points);


--
-- Name: clubs_division_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clubs_division_index ON public.clubs USING btree (division);


--
-- Name: clubs_est_actif_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX clubs_est_actif_index ON public.clubs USING btree (est_actif);


--
-- Name: commentaires_match_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX commentaires_match_id_statut_index ON public.commentaires USING btree (match_id, statut);


--
-- Name: commentaires_match_id_timestamp_commentaire_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX commentaires_match_id_timestamp_commentaire_index ON public.commentaires USING btree (match_id, timestamp_commentaire);


--
-- Name: competitions_niveau_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX competitions_niveau_index ON public.competitions USING btree (niveau);


--
-- Name: composition_joueurs_composition_id_est_titulaire_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX composition_joueurs_composition_id_est_titulaire_index ON public.composition_joueurs USING btree (composition_id, est_titulaire);


--
-- Name: compositions_match_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX compositions_match_id_statut_index ON public.compositions USING btree (match_id, statut);


--
-- Name: contestations_coach_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contestations_coach_id_statut_index ON public.contestations USING btree (coach_id, statut);


--
-- Name: contestations_match_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contestations_match_id_statut_index ON public.contestations USING btree (match_id, statut);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: joueurs_club_id_poste_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX joueurs_club_id_poste_index ON public.joueurs USING btree (club_id, poste);


--
-- Name: joueurs_num_licence_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX joueurs_num_licence_index ON public.joueurs USING btree (num_licence);


--
-- Name: joueurs_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX joueurs_statut_index ON public.joueurs USING btree (statut);


--
-- Name: match_events_joueur_id_type_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX match_events_joueur_id_type_index ON public.match_events USING btree (joueur_id, type);


--
-- Name: match_events_match_id_minute_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX match_events_match_id_minute_index ON public.match_events USING btree (match_id, minute);


--
-- Name: match_events_match_id_type_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX match_events_match_id_type_index ON public.match_events USING btree (match_id, type);


--
-- Name: matchs_club_domicile_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX matchs_club_domicile_id_statut_index ON public.matchs USING btree (club_domicile_id, statut);


--
-- Name: matchs_club_exterieur_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX matchs_club_exterieur_id_statut_index ON public.matchs USING btree (club_exterieur_id, statut);


--
-- Name: matchs_phase_id_journee_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX matchs_phase_id_journee_index ON public.matchs USING btree (phase_id, journee);


--
-- Name: matchs_statut_date_heure_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX matchs_statut_date_heure_index ON public.matchs USING btree (statut, date_heure);


--
-- Name: mobile_users_club_favori_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mobile_users_club_favori_id_index ON public.mobile_users USING btree (club_favori_id);


--
-- Name: mobile_users_id_anonyme_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mobile_users_id_anonyme_index ON public.mobile_users USING btree (id_anonyme);


--
-- Name: notifications_mobile_user_id_date_envoi_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_mobile_user_id_date_envoi_index ON public.notifications USING btree (mobile_user_id, date_envoi);


--
-- Name: notifications_mobile_user_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_mobile_user_id_statut_index ON public.notifications USING btree (mobile_user_id, statut);


--
-- Name: penalites_club_id_saison_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX penalites_club_id_saison_id_index ON public.penalites USING btree (club_id, saison_id);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: phases_saison_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX phases_saison_id_statut_index ON public.phases USING btree (saison_id, statut);


--
-- Name: phases_saison_id_type_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX phases_saison_id_type_index ON public.phases USING btree (saison_id, type);


--
-- Name: poules_phase_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX poules_phase_id_index ON public.poules USING btree (phase_id);


--
-- Name: saisons_competition_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX saisons_competition_id_statut_index ON public.saisons USING btree (competition_id, statut);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: stat_joueurs_saison_id_buts_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX stat_joueurs_saison_id_buts_index ON public.stat_joueurs USING btree (saison_id, buts);


--
-- Name: talent_scores_joueur_id_date_calcul_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX talent_scores_joueur_id_date_calcul_index ON public.talent_scores USING btree (joueur_id, date_calcul);


--
-- Name: talent_scores_score_global_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX talent_scores_score_global_index ON public.talent_scores USING btree (score_global);


--
-- Name: transferts_joueur_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transferts_joueur_id_statut_index ON public.transferts USING btree (joueur_id, statut);


--
-- Name: transferts_saison_id_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX transferts_saison_id_statut_index ON public.transferts USING btree (saison_id, statut);


--
-- Name: uq_stade_date_heure; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_stade_date_heure ON public.matchs USING btree (stade, date_heure) WHERE ((stade IS NOT NULL) AND ((statut)::text <> ALL ((ARRAY['reporte'::character varying, 'annule'::character varying])::text[])));


--
-- Name: users_role_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_index ON public.users USING btree (role);


--
-- Name: users_statut_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_statut_index ON public.users USING btree (statut);


--
-- Name: votes_match_id_type_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX votes_match_id_type_index ON public.votes USING btree (match_id, type);


--
-- Name: articles articles_journaliste_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_journaliste_id_foreign FOREIGN KEY (journaliste_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: articles articles_valide_par_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_valide_par_foreign FOREIGN KEY (valide_par) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: classements_clubs classements_clubs_club_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classements_clubs
    ADD CONSTRAINT classements_clubs_club_id_foreign FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: classements_clubs classements_clubs_phase_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classements_clubs
    ADD CONSTRAINT classements_clubs_phase_id_foreign FOREIGN KEY (phase_id) REFERENCES public.phases(id) ON DELETE CASCADE;


--
-- Name: classements_clubs classements_clubs_poule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classements_clubs
    ADD CONSTRAINT classements_clubs_poule_id_foreign FOREIGN KEY (poule_id) REFERENCES public.poules(id) ON DELETE SET NULL;


--
-- Name: club_poule club_poule_club_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_poule
    ADD CONSTRAINT club_poule_club_id_foreign FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: club_poule club_poule_poule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_poule
    ADD CONSTRAINT club_poule_poule_id_foreign FOREIGN KEY (poule_id) REFERENCES public.poules(id) ON DELETE CASCADE;


--
-- Name: club_poule club_poule_saison_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.club_poule
    ADD CONSTRAINT club_poule_saison_id_foreign FOREIGN KEY (saison_id) REFERENCES public.saisons(id) ON DELETE CASCADE;


--
-- Name: clubs clubs_responsable_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_responsable_id_foreign FOREIGN KEY (responsable_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: commentaires commentaires_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentaires
    ADD CONSTRAINT commentaires_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE CASCADE;


--
-- Name: commentaires commentaires_mobile_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commentaires
    ADD CONSTRAINT commentaires_mobile_user_id_foreign FOREIGN KEY (mobile_user_id) REFERENCES public.mobile_users(id) ON DELETE CASCADE;


--
-- Name: composition_joueurs composition_joueurs_composition_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.composition_joueurs
    ADD CONSTRAINT composition_joueurs_composition_id_foreign FOREIGN KEY (composition_id) REFERENCES public.compositions(id) ON DELETE CASCADE;


--
-- Name: composition_joueurs composition_joueurs_joueur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.composition_joueurs
    ADD CONSTRAINT composition_joueurs_joueur_id_foreign FOREIGN KEY (joueur_id) REFERENCES public.joueurs(id) ON DELETE RESTRICT;


--
-- Name: compositions compositions_club_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compositions
    ADD CONSTRAINT compositions_club_id_foreign FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: compositions compositions_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compositions
    ADD CONSTRAINT compositions_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE CASCADE;


--
-- Name: compositions compositions_soumis_par_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compositions
    ADD CONSTRAINT compositions_soumis_par_foreign FOREIGN KEY (soumis_par) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: contestations contestations_coach_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contestations
    ADD CONSTRAINT contestations_coach_id_foreign FOREIGN KEY (coach_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: contestations contestations_match_event_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contestations
    ADD CONSTRAINT contestations_match_event_id_foreign FOREIGN KEY (match_event_id) REFERENCES public.match_events(id) ON DELETE CASCADE;


--
-- Name: contestations contestations_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contestations
    ADD CONSTRAINT contestations_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE CASCADE;


--
-- Name: contestations contestations_traitee_par_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contestations
    ADD CONSTRAINT contestations_traitee_par_foreign FOREIGN KEY (traitee_par) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: feuilles_de_match feuilles_de_match_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feuilles_de_match
    ADD CONSTRAINT feuilles_de_match_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE CASCADE;


--
-- Name: feuilles_de_match feuilles_de_match_valide_par_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feuilles_de_match
    ADD CONSTRAINT feuilles_de_match_valide_par_foreign FOREIGN KEY (valide_par) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: joueurs joueurs_club_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.joueurs
    ADD CONSTRAINT joueurs_club_id_foreign FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;


--
-- Name: match_arbitres match_arbitres_arbitre_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_arbitres
    ADD CONSTRAINT match_arbitres_arbitre_id_foreign FOREIGN KEY (arbitre_id) REFERENCES public.arbitres(id) ON DELETE RESTRICT;


--
-- Name: match_arbitres match_arbitres_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_arbitres
    ADD CONSTRAINT match_arbitres_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE CASCADE;


--
-- Name: match_events match_events_club_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_club_id_foreign FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;


--
-- Name: match_events match_events_joueur2_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_joueur2_id_foreign FOREIGN KEY (joueur2_id) REFERENCES public.joueurs(id) ON DELETE SET NULL;


--
-- Name: match_events match_events_joueur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_joueur_id_foreign FOREIGN KEY (joueur_id) REFERENCES public.joueurs(id) ON DELETE SET NULL;


--
-- Name: match_events match_events_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_events
    ADD CONSTRAINT match_events_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE CASCADE;


--
-- Name: matchs matchs_arbitre_principal_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matchs
    ADD CONSTRAINT matchs_arbitre_principal_id_foreign FOREIGN KEY (arbitre_principal_id) REFERENCES public.arbitres(id) ON DELETE SET NULL;


--
-- Name: matchs matchs_club_domicile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matchs
    ADD CONSTRAINT matchs_club_domicile_id_foreign FOREIGN KEY (club_domicile_id) REFERENCES public.clubs(id) ON DELETE RESTRICT;


--
-- Name: matchs matchs_club_exterieur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matchs
    ADD CONSTRAINT matchs_club_exterieur_id_foreign FOREIGN KEY (club_exterieur_id) REFERENCES public.clubs(id) ON DELETE RESTRICT;


--
-- Name: matchs matchs_commissaire_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matchs
    ADD CONSTRAINT matchs_commissaire_id_foreign FOREIGN KEY (commissaire_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: matchs matchs_phase_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matchs
    ADD CONSTRAINT matchs_phase_id_foreign FOREIGN KEY (phase_id) REFERENCES public.phases(id) ON DELETE RESTRICT;


--
-- Name: matchs matchs_poule_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matchs
    ADD CONSTRAINT matchs_poule_id_foreign FOREIGN KEY (poule_id) REFERENCES public.poules(id) ON DELETE SET NULL;


--
-- Name: mobile_users mobile_users_club_favori_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mobile_users
    ADD CONSTRAINT mobile_users_club_favori_id_foreign FOREIGN KEY (club_favori_id) REFERENCES public.clubs(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_match_event_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_match_event_id_foreign FOREIGN KEY (match_event_id) REFERENCES public.match_events(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_mobile_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_mobile_user_id_foreign FOREIGN KEY (mobile_user_id) REFERENCES public.mobile_users(id) ON DELETE CASCADE;


--
-- Name: penalites penalites_admin_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalites
    ADD CONSTRAINT penalites_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: penalites penalites_club_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalites
    ADD CONSTRAINT penalites_club_id_foreign FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE RESTRICT;


--
-- Name: penalites penalites_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalites
    ADD CONSTRAINT penalites_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE SET NULL;


--
-- Name: penalites penalites_saison_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalites
    ADD CONSTRAINT penalites_saison_id_foreign FOREIGN KEY (saison_id) REFERENCES public.saisons(id) ON DELETE RESTRICT;


--
-- Name: phases phases_saison_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phases
    ADD CONSTRAINT phases_saison_id_foreign FOREIGN KEY (saison_id) REFERENCES public.saisons(id) ON DELETE CASCADE;


--
-- Name: poules poules_phase_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poules
    ADD CONSTRAINT poules_phase_id_foreign FOREIGN KEY (phase_id) REFERENCES public.phases(id) ON DELETE CASCADE;


--
-- Name: prediction_matchs prediction_matchs_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prediction_matchs
    ADD CONSTRAINT prediction_matchs_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE CASCADE;


--
-- Name: regles_saisons regles_saisons_saison_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regles_saisons
    ADD CONSTRAINT regles_saisons_saison_id_foreign FOREIGN KEY (saison_id) REFERENCES public.saisons(id) ON DELETE CASCADE;


--
-- Name: saisons saisons_competition_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saisons
    ADD CONSTRAINT saisons_competition_id_foreign FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE RESTRICT;


--
-- Name: stat_joueurs stat_joueurs_club_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_joueurs
    ADD CONSTRAINT stat_joueurs_club_id_foreign FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: stat_joueurs stat_joueurs_joueur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_joueurs
    ADD CONSTRAINT stat_joueurs_joueur_id_foreign FOREIGN KEY (joueur_id) REFERENCES public.joueurs(id) ON DELETE CASCADE;


--
-- Name: stat_joueurs stat_joueurs_saison_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stat_joueurs
    ADD CONSTRAINT stat_joueurs_saison_id_foreign FOREIGN KEY (saison_id) REFERENCES public.saisons(id) ON DELETE CASCADE;


--
-- Name: talent_scores talent_scores_joueur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.talent_scores
    ADD CONSTRAINT talent_scores_joueur_id_foreign FOREIGN KEY (joueur_id) REFERENCES public.joueurs(id) ON DELETE CASCADE;


--
-- Name: transferts transferts_club_cedant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferts
    ADD CONSTRAINT transferts_club_cedant_id_foreign FOREIGN KEY (club_cedant_id) REFERENCES public.clubs(id) ON DELETE RESTRICT;


--
-- Name: transferts transferts_club_receveur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferts
    ADD CONSTRAINT transferts_club_receveur_id_foreign FOREIGN KEY (club_receveur_id) REFERENCES public.clubs(id) ON DELETE RESTRICT;


--
-- Name: transferts transferts_joueur_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferts
    ADD CONSTRAINT transferts_joueur_id_foreign FOREIGN KEY (joueur_id) REFERENCES public.joueurs(id) ON DELETE RESTRICT;


--
-- Name: transferts transferts_saison_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferts
    ADD CONSTRAINT transferts_saison_id_foreign FOREIGN KEY (saison_id) REFERENCES public.saisons(id) ON DELETE RESTRICT;


--
-- Name: transferts transferts_valide_par_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transferts
    ADD CONSTRAINT transferts_valide_par_foreign FOREIGN KEY (valide_par) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: votes votes_match_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_match_id_foreign FOREIGN KEY (match_id) REFERENCES public.matchs(id) ON DELETE CASCADE;


--
-- Name: votes votes_mobile_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_mobile_user_id_foreign FOREIGN KEY (mobile_user_id) REFERENCES public.mobile_users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Ut8pwXqa5fftqxSkFzjQKac4iEDhqbeLsy2vbLNKH7WHW9VJrBwnpXNcQiujBXm

