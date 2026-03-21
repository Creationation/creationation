
-- Enums
CREATE TYPE public.project_status AS ENUM ('brief', 'maquette', 'development', 'review', 'delivered', 'maintenance');
CREATE TYPE public.project_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');

-- Projects
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status project_status NOT NULL DEFAULT 'brief',
  priority project_priority NOT NULL DEFAULT 'medium',
  project_type text,
  budget numeric(10,2),
  currency text DEFAULT 'EUR',
  start_date date,
  deadline date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project tasks
CREATE TABLE public.project_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'todo',
  assigned_to uuid REFERENCES public.profiles(id),
  position integer NOT NULL DEFAULT 0,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project milestones
CREATE TABLE public.project_milestones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  completed_at timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Project files
CREATE TABLE public.project_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Project notes
CREATE TABLE public.project_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Project templates
CREATE TABLE public.project_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  default_tasks jsonb,
  default_milestones jsonb,
  created_at timestamptz DEFAULT now()
);

-- Triggers for updated_at
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage project_tasks" ON public.project_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage project_milestones" ON public.project_milestones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage project_files" ON public.project_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage project_notes" ON public.project_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage project_templates" ON public.project_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for projects
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Seed templates
INSERT INTO public.project_templates (name, description, default_tasks, default_milestones) VALUES
('Application iOS/Android', 'Template pour le développement d''applications mobiles',
  '[{"title":"Réception du brief client"},{"title":"Analyse des besoins et specs techniques"},{"title":"Wireframes / maquettes UI"},{"title":"Validation maquettes par le client"},{"title":"Setup projet (repo, environnement, CI/CD)"},{"title":"Développement frontend"},{"title":"Développement backend / API"},{"title":"Intégration des assets et contenus"},{"title":"Tests fonctionnels et QA"},{"title":"Beta test avec le client"},{"title":"Corrections et ajustements"},{"title":"Soumission App Store / Play Store"},{"title":"Livraison finale et documentation"}]',
  '[{"title":"Brief validé"},{"title":"Maquettes approuvées"},{"title":"MVP fonctionnel"},{"title":"Version beta livrée"},{"title":"App publiée"}]'),
('Site vitrine', 'Template pour les sites vitrines',
  '[{"title":"Réception du brief et contenus"},{"title":"Recherche de références design"},{"title":"Maquette page d''accueil"},{"title":"Maquettes pages secondaires"},{"title":"Validation design par le client"},{"title":"Développement et intégration"},{"title":"Optimisation SEO de base"},{"title":"Tests responsive (mobile, tablette, desktop)"},{"title":"Mise en ligne"},{"title":"Formation client (admin du site)"}]',
  '[{"title":"Brief validé"},{"title":"Design approuvé"},{"title":"Site en ligne"},{"title":"Formation terminée"}]'),
('Landing page', 'Template pour les landing pages',
  '[{"title":"Brief et objectifs de conversion"},{"title":"Copywriting / contenu"},{"title":"Design de la landing page"},{"title":"Validation par le client"},{"title":"Développement et intégration"},{"title":"Setup analytics et tracking"},{"title":"Tests A/B si applicable"},{"title":"Mise en ligne"}]',
  '[{"title":"Contenu validé"},{"title":"Design approuvé"},{"title":"Page en ligne"}]'),
('Web app', 'Template pour les applications web',
  '[{"title":"Analyse fonctionnelle détaillée"},{"title":"Architecture technique"},{"title":"Wireframes et user flows"},{"title":"Design UI complet"},{"title":"Validation UX/UI par le client"},{"title":"Setup infrastructure (DB, hosting, CI/CD)"},{"title":"Développement feature par feature"},{"title":"Intégration API tierces si nécessaire"},{"title":"Tests unitaires et d''intégration"},{"title":"Tests utilisateurs"},{"title":"Corrections et optimisations"},{"title":"Déploiement production"},{"title":"Documentation technique"},{"title":"Formation et handover"}]',
  '[{"title":"Specs validées"},{"title":"Design approuvé"},{"title":"MVP fonctionnel"},{"title":"Beta livrée"},{"title":"Production live"}]');
