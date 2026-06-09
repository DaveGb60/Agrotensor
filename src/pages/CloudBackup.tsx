import { useEffect, useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, Copy, KeyRound, LogOut, Loader2, ShieldCheck, Fingerprint, Lock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  CloudIdentity,
  CloudStatus,
  backupToCloud,
  clearIdentity,
  createCloudIdentity,
  decodeIdentityToken,
  encodeIdentityToken,
  getCloudStatus,
  getStoredIdentity,
  restoreFromCloud,
  storeIdentity,
  verifyAndStoreIdentity,
} from '@/lib/cloudBackup';
import {
  createVault,
  unlockVault,
  hasVault,
  clearVault,
  isPlatformAuthenticatorAvailable,
} from '@/lib/webauthnVault';

export default function CloudBackup() {
  const [identity, setIdentity] = useState<CloudIdentity | null>(null);
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const [showNewIdentity, setShowNewIdentity] = useState<CloudIdentity | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [vaultPresent, setVaultPresent] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    setVaultPresent(hasVault());
    isPlatformAuthenticatorAvailable().then(setBioAvailable);

    // Only auto-load if there is no vault (legacy plain identity).
    if (!hasVault()) {
      const stored = getStoredIdentity();
      if (stored) {
        setIdentity(stored);
        refreshStatus(stored);
      }
    }
  }, []);

  async function refreshStatus(id: CloudIdentity) {
    try {
      setLoading(true);
      const s = await getCloudStatus(id);
      setStatus(s);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function protectWithBiometrics(id: CloudIdentity, silent = false) {
    try {
      await createVault(id);
      clearIdentity(); // remove plaintext copy
      setVaultPresent(true);
      if (!silent) toast.success('Cloud ID protected with device biometrics');
    } catch (e) {
      toast.error(`Biometric protection failed: ${(e as Error).message}`);
    }
  }

  async function handleCreate() {
    try {
      setLoading(true);
      const id = await createCloudIdentity();
      setIdentity(id);
      setShowNewIdentity(id);
      await refreshStatus(id);
      // Offer biometric protection automatically when supported
      if (bioAvailable) {
        await protectWithBiometrics(id, true);
      }
      toast.success('Cloud identity created');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock() {
    try {
      setUnlocking(true);
      const id = await unlockVault();
      setIdentity(id);
      await refreshStatus(id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUnlocking(false);
    }
  }

  async function handleRestoreIdentity() {
    const parsed = decodeIdentityToken(tokenInput);
    if (!parsed) {
      toast.error('Invalid Cloud ID format');
      return;
    }
    try {
      setLoading(true);
      const s = await verifyAndStoreIdentity(parsed);
      setIdentity(parsed);
      setStatus(s);
      setShowRestoreDialog(false);
      setTokenInput('');
      if (bioAvailable) {
        await protectWithBiometrics(parsed, true);
      }
      toast.success('Cloud identity restored');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBackup() {
    if (!identity) return;
    try {
      setBusy('backup');
      const r = await backupToCloud(identity);
      toast.success(`Backed up ${r.project_count} projects, ${r.record_count} records`);
      await refreshStatus(identity);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    if (!identity) return;
    try {
      setBusy('restore');
      const r = await restoreFromCloud(identity);
      toast.success(
        `Restored ${r.importedProjects} projects, ${r.importedRecords} new records (${r.skippedRecords} skipped)`
      );
      await refreshStatus(identity);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function handleSignOut() {
    clearIdentity();
    clearVault();
    setIdentity(null);
    setStatus(null);
    setVaultPresent(false);
    toast.success('Signed out of Cloud Backup');
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-hero shadow-soft">
            <Cloud className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Cloud Backup</h1>
            <p className="text-sm text-muted-foreground">Securely back up your farm data to the cloud</p>
          </div>
        </div>

        {!identity && vaultPresent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" /> Cloud ID locked
              </CardTitle>
              <CardDescription>
                Your Cloud ID is protected by this device's biometrics. Unlock to back up or restore.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2" onClick={handleUnlock} disabled={unlocking}>
                {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                Unlock with biometrics
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full text-muted-foreground">
                Forget this device
              </Button>
            </CardContent>
          </Card>
        )}

        {!identity && !vaultPresent && (
          <Card>
            <CardHeader>
              <CardTitle>Get started</CardTitle>
              <CardDescription>
                Create a Cloud ID to back up your data, or use an existing Cloud ID to restore data on this device.
                {bioAvailable && ' Your Cloud ID will be protected by this device\'s biometrics so you don\'t have to store it yourself.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2" onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Create Cloud ID
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowRestoreDialog(true)}>
                <KeyRound className="h-4 w-4" />
                Use Existing Cloud ID
              </Button>
            </CardContent>
          </Card>
        )}

        {identity && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Your Cloud Identity
                  {vaultPresent && <Lock className="h-3.5 w-3.5 text-primary" />}
                </CardTitle>
                <CardDescription>
                  {vaultPresent
                    ? 'Protected on this device with biometrics. Reveal the ID only to set up another device.'
                    : 'Keep this ID safe — you\'ll need it to restore data on other devices.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input readOnly value={encodeIdentityToken(identity)} className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(encodeIdentityToken(identity), 'Cloud ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {!vaultPresent && bioAvailable && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => protectWithBiometrics(identity)}
                  >
                    <Fingerprint className="h-4 w-4" />
                    Protect with biometrics
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                  Sign out of Cloud
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Backup Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projects in cloud</span>
                  <span className="font-medium">{status?.project_count ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Records in cloud</span>
                  <span className="font-medium">{status?.record_count ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last backup</span>
                  <span className="font-medium">
                    {status?.last_backup ? new Date(status.last_backup.created_at).toLocaleString() : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button className="gap-2" onClick={handleBackup} disabled={busy !== null}>
                {busy === 'backup' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                Back up to Cloud
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleRestore} disabled={busy !== null}>
                {busy === 'restore' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
                Restore from Cloud
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Backup pushes your active projects and records. Restore merges cloud data without creating duplicates.
            </p>
          </>
        )}
      </main>

      {/* New identity reveal dialog */}
      <Dialog open={!!showNewIdentity} onOpenChange={(open) => !open && setShowNewIdentity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your Cloud ID</DialogTitle>
            <DialogDescription>
              {bioAvailable
                ? 'Your Cloud ID is stored on this device and unlocked with biometrics. To use it on another device, copy it once and keep it somewhere safe — it cannot be recovered if lost.'
                : 'This is the only way to access your backup from another device. Copy and store it somewhere safe — it cannot be recovered if lost.'}
            </DialogDescription>
          </DialogHeader>
          {showNewIdentity && (
            <div className="space-y-2">
              <Label className="text-xs">Cloud ID</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={encodeIdentityToken(showNewIdentity)} className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copy(encodeIdentityToken(showNewIdentity), 'Cloud ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowNewIdentity(null)}>I've saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore identity dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Existing Cloud ID</DialogTitle>
            <DialogDescription>
              Paste the Cloud ID you saved from another device.
              {bioAvailable && ' It will then be sealed in this device\'s biometric vault.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cloud-id" className="text-xs">Cloud ID</Label>
            <Input
              id="cloud-id"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.xxxxxxxx"
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRestoreDialog(false)}>Cancel</Button>
            <Button onClick={handleRestoreIdentity} disabled={loading || !tokenInput.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
