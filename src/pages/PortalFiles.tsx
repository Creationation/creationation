import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Download, FileIcon, Image as ImageIcon } from 'lucide-react';
import { sendPortalNotification } from '@/lib/portalNotifications';

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip'];

const PortalFiles = () => {
  const { client } = useOutletContext<{ client: { id: string } }>();
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [clientFiles, setClientFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!client?.id) return;
    const { data: projects } = await supabase.from('projects').select('id').eq('client_id', client.id);
    const pids = (projects || []).map(p => p.id);
    if (pids.length) {
      const { data } = await supabase.from('project_files').select('*').in('project_id', pids).order('created_at', { ascending: false });
      setProjectFiles(data || []);
    }
    const { data: files } = await supabase.storage.from('client-uploads').list(client.id);
    setClientFiles((files || []).map(f => ({ ...f, url: supabase.storage.from('client-uploads').getPublicUrl(`${client.id}/${f.name}`).data.publicUrl })));
  }, [client]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFiles = async (fileList: FileList) => {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_SIZE) { toast.error(`${file.name} dépasse 10MB`); continue; }
      if (!ACCEPTED.includes(file.type) && !file.name.endsWith('.svg')) { toast.error(`Format non supporté : ${file.name}`); continue; }
      const path = `${client.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('client-uploads').upload(path, file);
      if (error) toast.error(`Erreur upload : ${file.name}`);
      else {
        toast.success(`${file.name} uploadé`);
        // Notify admin (uses client_id as notification target — admin sees via admin panel)
        // We create a general notification visible to admin side
        try {
          await supabase.from('portal_notifications').insert({
            client_id: client.id,
            type: 'general',
            title: 'Nouveau fichier uploadé',
            message: file.name,
            link: '/portal/files',
          } as any);
        } catch {}
      }
    }
    setUploading(false);
    fetchFiles();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|svg|webp)$/i.test(name);

  return (
    <div className="space-y-6">
      <h1 style={{ fontFamily: 'var(--font-h)', fontSize: 24, color: 'var(--charcoal)' }}>Fichiers</h1>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          borderRadius: 'var(--r)', border: `2px dashed ${dragOver ? 'var(--teal)' : 'var(--glass-border)'}`,
          padding: 32, textAlign: 'center', background: dragOver ? 'var(--teal-glow)' : 'var(--glass-bg)',
          transition: 'all 0.2s', cursor: 'pointer',
        }}
        onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.onchange = () => { if (i.files) uploadFiles(i.files); }; i.click(); }}
      >
        <Upload size={28} color="var(--teal)" style={{ margin: '0 auto 8px' }} />
        <p style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--text-mid)', margin: 0 }}>
          {uploading ? 'Upload en cours...' : 'Glissez vos fichiers ici ou cliquez pour parcourir'}
        </p>
        <p style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
          Max 10MB — JPG, PNG, SVG, PDF, DOC, TXT, ZIP
        </p>
      </div>

      {clientFiles.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: '0 0 12px' }}>Mes fichiers</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {clientFiles.map(f => (
              <a key={f.name} href={f.url} target="_blank" rel="noreferrer" style={{
                padding: 12, borderRadius: 14, background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)',
                textDecoration: 'none', display: 'block', backdropFilter: 'blur(10px)',
              }}>
                {isImage(f.name) ? (
                  <div style={{ width: '100%', height: 80, borderRadius: 8, overflow: 'hidden', marginBottom: 8, background: 'rgba(0,0,0,0.04)' }}>
                    <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <FileIcon size={24} color="var(--text-light)" style={{ marginBottom: 8 }} />
                )}
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/^\d+_/, '')}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {projectFiles.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-h)', fontSize: 16, color: 'var(--charcoal)', margin: '0 0 12px' }}>Fichiers du projet</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {projectFiles.map(f => (
              <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" style={{
                padding: 12, borderRadius: 14, background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)',
                textDecoration: 'none', display: 'block', backdropFilter: 'blur(10px)',
              }}>
                {isImage(f.file_name) ? <ImageIcon size={24} color="var(--sky)" style={{ marginBottom: 8 }} /> : <FileIcon size={24} color="var(--text-light)" style={{ marginBottom: 8 }} />}
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file_name}</div>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>{f.file_type || 'fichier'}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {!projectFiles.length && !clientFiles.length && (
        <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Aucun fichier.</div>
      )}
    </div>
  );
};

export default PortalFiles;
