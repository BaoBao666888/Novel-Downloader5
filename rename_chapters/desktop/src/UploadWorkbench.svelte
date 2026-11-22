<script lang="ts">
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { onMount, tick } from 'svelte';
  import {
    cancelUploadSchedule,
    checkUploadSession,
    chooseUploadFolder,
    cleanupUploadStorage,
    clearUploadSessionCookie,
    createUploadJob,
    deleteUploadJob,
    exportUploadJobRecovery,
    getUploadRuntimeStatus,
    getUploadSessionStatus,
    linkUploadJob,
    listUploadWorkspace,
    pickUploadBackupZip,
    previewUploadJobRecovery,
    restoreUploadBackupZip,
    runDueUploadVerifications,
    saveUploadSessionCookie,
    scanUploadFolder,
    scheduleUploadJob,
    setUploadAutoSchedule,
    startUploadJobNow,
    stopActiveUpload,
    verifyUploadJobNow,
    type BackupZipInspection,
    type CreditPosition,
    type FolderChapterScan,
    type JobMode,
    type JobStatus,
    type JobView,
    type LiveRunProgress,
    type RecoveryReport,
    type SessionCheckResult,
    type SessionSecretStatus,
    type UploadRuntimeStatus,
    type UploadWorkspaceSnapshot,
  } from './studio';

  type Props = {
    parentBusy: boolean;
  };

  let { parentBusy }: Props = $props();

  const CHAPTER_PAGE_SIZE = 40;
  const PARENT_STATUSES = new Set<JobStatus>([
    'scheduled',
    'linked',
    'queued',
    'running',
    'sending',
    'verifying',
    'waiting',
    'uncertain',
    'complete',
  ]);

  let snapshot = $state<UploadWorkspaceSnapshot | null>(null);
  let sessionStatus = $state<SessionSecretStatus | null>(null);
  let runtime = $state<UploadRuntimeStatus | null>(null);
  let liveProgress = $state<LiveRunProgress | null>(null);
  let selectedId = $state<string | null>(null);
  let query = $state('');
  let statusFilter = $state<'all' | 'pending' | 'attention' | 'complete'>('all');
  let chapterPage = $state(0);

  let busy = $state<
    | 'load'
    | 'scan'
    | 'create'
    | 'schedule'
    | 'link'
    | 'cancel'
    | 'delete'
    | 'export'
    | 'import'
    | 'cleanup'
    | 'session'
    | 'verify'
    | 'start'
    | null
  >(null);
  let error = $state('');
  let notice = $state('');
  let recoveryDismissed = $state(false);

  // Session DPAPI dialog state
  let sessionDialog: HTMLDialogElement | undefined = $state();
  let sessionCookieInput = $state('');
  let sessionCheck = $state<SessionCheckResult | null>(null);
  let sessionError = $state('');

  // Start immediate confirm dialog state
  let startConfirmDialog: HTMLDialogElement | undefined = $state();
  let startConflictConsent = $state(false);

  // Create job dialog state
  let createDialog: HTMLDialogElement | undefined = $state();
  let createFolderPath = $state('');
  let createScan = $state<FolderChapterScan | null>(null);
  let createMode = $state<JobMode>('new');
  let createAccount = $state('local-draft');
  let createTitleVi = $state('');
  let createTitleCn = $state('');
  let createAuthorCn = $state('');
  let createDescVi = $state('');
  let createBookUrl = $state('');
  let createVolumeName = $state('Chính văn');
  let createVolumeNote = $state('');
  let createAppend = $state(false);
  let createCreditText = $state('');
  let createCreditKind = $state<'end' | 'start' | 'line'>('end');
  let createCreditLine = $state(2);
  let createError = $state('');

  // Schedule dialog state
  let scheduleDialog: HTMLDialogElement | undefined = $state();
  let scheduleDatetime = $state('');
  let scheduleAllowDup = $state(false);
  let scheduleConflictSeen = $state(false);
  let scheduleError = $state('');

  // Link dialog state
  let linkDialog: HTMLDialogElement | undefined = $state();
  let linkParentId = $state('');
  let linkAllowDup = $state(false);
  let linkConflictSeen = $state(false);
  let linkError = $state('');

  // Recovery export / backup restore / delete dialogs
  let exportDialog: HTMLDialogElement | undefined = $state();
  let recoveryReport = $state<RecoveryReport | null>(null);
  let exportResultPath = $state('');
  let importDialog: HTMLDialogElement | undefined = $state();
  let backupInspection = $state<BackupZipInspection | null>(null);
  let importAccount = $state('local-draft');
  let importError = $state('');
  let deleteDialog: HTMLDialogElement | undefined = $state();

  const isBusy = $derived(busy !== null || parentBusy);
  const jobs = $derived(snapshot?.jobs ?? []);
  const crashRecovery = $derived(snapshot?.crashRecovery);
  const showCrashBanner = $derived(
    !recoveryDismissed &&
      !!crashRecovery &&
      (crashRecovery.uncertainIds.length > 0 || crashRecovery.failedIds.length > 0),
  );

  const visibleJobs = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter === 'pending') {
        if (
          ![
            'planned',
            'scheduled',
            'linked',
            'queued',
            'running',
            'sending',
            'verifying',
            'waiting',
          ].includes(job.status)
        ) {
          return false;
        }
      } else if (statusFilter === 'attention') {
        if (!['uncertain', 'failed'].includes(job.status) && !job.needsReconcile) return false;
      } else if (statusFilter === 'complete') {
        if (job.status !== 'complete') return false;
      }
      if (!q) return true;
      return (
        job.title.toLowerCase().includes(q) ||
        job.account.toLowerCase().includes(q) ||
        job.bookUrl.toLowerCase().includes(q) ||
        statusLabel(job.status).toLowerCase().includes(q)
      );
    });
  });

  const selectedJob = $derived(jobs.find((job) => job.id === selectedId) ?? null);
  const activeRunForSelected = $derived.by(() => {
    const active = liveProgress?.active ? liveProgress : runtime?.activeRun;
    if (!active || !active.active || !selectedJob || active.jobId !== selectedJob.id) return null;
    return active;
  });
  const anyRunActive = $derived(Boolean(liveProgress?.active || runtime?.activeRun?.active));

  const sessionPillLabel = $derived.by(() => {
    if (runtime?.verifiedAccount) return `Phiên: ${runtime.verifiedAccount}`;
    if (sessionStatus?.configured && sessionStatus.readable) return `Phiên DPAPI (${sessionStatus.masked})`;
    if (sessionStatus?.configured) return 'Phiên lỗi giải mã';
    return 'Chưa nối phiên';
  });

  const eligibleParents = $derived.by(() => {
    if (!selectedJob) return [];
    return jobs.filter(
      (candidate) =>
        candidate.id !== selectedJob.id &&
        candidate.account === selectedJob.account &&
        PARENT_STATUSES.has(candidate.status),
    );
  });

  const totalChapterPages = $derived(
    Math.max(1, Math.ceil((selectedJob?.chapters.length ?? 0) / CHAPTER_PAGE_SIZE)),
  );
  const clampedChapterPage = $derived(Math.min(chapterPage, totalChapterPages - 1));
  const pagedChapters = $derived(
    (selectedJob?.chapters ?? []).slice(
      clampedChapterPage * CHAPTER_PAGE_SIZE,
      (clampedChapterPage + 1) * CHAPTER_PAGE_SIZE,
    ),
  );

  onMount(() => {
    let unlisten: UnlistenFn | undefined;
    let pollTimer: number | undefined;

    void refreshWorkspace();

    void listen<LiveRunProgress>('upload-progress', (event) => {
      liveProgress = event.payload;
      if (!event.payload.active) {
        liveProgress = null;
        void syncRuntimeAndWorkspace();
      }
    }).then((fn) => {
      unlisten = fn;
    });

    pollTimer = window.setInterval(() => {
      if (anyRunActive) {
        void syncRuntimeAndWorkspace();
      }
    }, 1500);

    return () => {
      unlisten?.();
      if (pollTimer !== undefined) window.clearInterval(pollTimer);
    };
  });

  function statusLabel(status: JobStatus): string {
    switch (status) {
      case 'planned':
        return 'Dự kiến';
      case 'scheduled':
        return 'Đã hẹn giờ';
      case 'linked':
        return 'Đã liên kết';
      case 'queued':
        return 'Chờ gửi';
      case 'running':
        return 'Đang chạy';
      case 'sending':
        return 'Đang tải lên';
      case 'verifying':
        return 'Đang đối chiếu';
      case 'waiting':
        return 'Chờ xác nhận';
      case 'uncertain':
        return 'Cần kiểm tra';
      case 'failed':
        return 'Tạm dừng';
      case 'complete':
        return 'Hoàn tất';
    }
  }

  function statusTone(status: JobStatus): 'accent' | 'warn' | 'muted' {
    if (status === 'uncertain' || status === 'failed') return 'warn';
    if (
      status === 'complete' ||
      status === 'scheduled' ||
      status === 'linked' ||
      status === 'running' ||
      status === 'sending' ||
      status === 'verifying'
    ) {
      return 'accent';
    }
    return 'muted';
  }

  function volumeStatusLabel(status: JobView['volumes'][number]['status']): string {
    switch (status) {
      case 'planned':
        return 'Chờ tải';
      case 'created':
        return 'Đã tạo quyển';
      case 'uploaded':
        return 'Đã tải file';
      case 'verified':
        return 'Đã xác nhận';
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatTimestamp(ms: number | null): string {
    if (!ms) return '—';
    return new Date(ms).toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function toDatetimeLocalValue(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function applySnapshot(next: UploadWorkspaceSnapshot, preferId?: string) {
    snapshot = next;
    const candidateId = preferId ?? selectedId;
    if (candidateId && next.jobs.some((j) => j.id === candidateId)) {
      selectedId = candidateId;
    } else {
      selectedId = next.jobs[0]?.id ?? null;
    }
    if (next.crashRecovery.uncertainIds.length > 0 || next.crashRecovery.failedIds.length > 0) {
      recoveryDismissed = false;
    }
    chapterPage = 0;
  }

  async function syncRuntimeAndWorkspace() {
    try {
      const [nextSnap, nextRt, nextSess] = await Promise.all([
        listUploadWorkspace(),
        getUploadRuntimeStatus(),
        getUploadSessionStatus(),
      ]);
      applySnapshot(nextSnap);
      runtime = nextRt;
      sessionStatus = nextSess;
      if (nextRt.activeRun?.active) {
        liveProgress = nextRt.activeRun;
      } else {
        liveProgress = null;
        if (nextRt.lastError) error = nextRt.lastError;
        else if (nextRt.lastMessage) notice = nextRt.lastMessage;
      }
    } catch (cause) {
      error = String(cause);
    }
  }

  async function refreshWorkspace() {
    if (busy !== null) return;
    busy = 'load';
    error = '';
    try {
      const [nextSnap, nextSess, nextRt] = await Promise.all([
        listUploadWorkspace(),
        getUploadSessionStatus(),
        getUploadRuntimeStatus(),
      ]);
      applySnapshot(nextSnap);
      sessionStatus = nextSess;
      runtime = nextRt;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  function openSessionDialog() {
    if (isBusy) return;
    sessionCookieInput = '';
    sessionCheck = null;
    sessionError = '';
    sessionDialog?.showModal();
  }

  async function handleSaveSession() {
    if (isBusy) return;
    busy = 'session';
    sessionError = '';
    sessionCheck = null;
    try {
      sessionStatus = await saveUploadSessionCookie(sessionCookieInput);
      runtime = await getUploadRuntimeStatus();
      sessionCookieInput = '';
      notice = 'Đã mã hóa và lưu Cookie phiên bằng Windows DPAPI.';
    } catch (cause) {
      sessionError = String(cause);
    } finally {
      busy = null;
    }
  }

  async function handleCheckSession() {
    if (isBusy) return;
    busy = 'session';
    sessionError = '';
    try {
      sessionCheck = await checkUploadSession();
      runtime = await getUploadRuntimeStatus();
      if (sessionCheck.authenticated) {
        notice = sessionCheck.message;
      }
    } catch (cause) {
      sessionError = String(cause);
    } finally {
      busy = null;
    }
  }

  async function handleClearSession() {
    if (isBusy) return;
    busy = 'session';
    sessionError = '';
    sessionCheck = null;
    try {
      sessionStatus = await clearUploadSessionCookie();
      runtime = await getUploadRuntimeStatus();
      notice = 'Đã xóa tệp phiên DPAPI khỏi máy.';
    } catch (cause) {
      sessionError = String(cause);
    } finally {
      busy = null;
    }
  }

  function openStartConfirm() {
    if (!selectedJob || isBusy || anyRunActive) return;
    if (!sessionStatus?.configured || !sessionStatus.readable) {
      openSessionDialog();
      sessionError = 'Cần lưu Cookie phiên hợp lệ trước khi bắt đầu tải lên.';
      return;
    }
    startConflictConsent = selectedJob.pendingConflicts.length === 0;
    startConfirmDialog?.showModal();
  }

  async function confirmStartNow() {
    if (!selectedJob || isBusy) return;
    startConfirmDialog?.close();
    busy = 'start';
    error = '';
    notice = '';
    try {
      runtime = await startUploadJobNow(
        selectedJob.id,
        selectedJob.scheduleRevision,
        selectedJob.pendingConflicts,
      );
      if (runtime.activeRun) {
        liveProgress = runtime.activeRun;
      }
      notice = `Đang bắt đầu lượt gửi «${selectedJob.title}»…`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function handleStopActive() {
    if (isBusy) return;
    try {
      const stopped = await stopActiveUpload();
      if (stopped) {
        notice = 'Đã gửi yêu cầu dừng lượt tải đang chạy; sẽ giữ trạng thái an toàn để đối chiếu.';
      }
    } catch (cause) {
      error = String(cause);
    }
  }

  async function handleVerifySelected() {
    if (!selectedJob || isBusy) return;
    busy = 'verify';
    error = '';
    notice = '';
    try {
      const out = await verifyUploadJobNow(selectedJob.id);
      applySnapshot(out.snapshot, selectedJob.id);
      if (out.record) {
        notice = `${statusLabel(out.record.status)}: ${out.record.message}`;
      } else {
        notice = 'Đã kiểm tra trạng thái công việc.';
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function handleRunDueVerifications() {
    if (isBusy) return;
    busy = 'verify';
    error = '';
    notice = '';
    try {
      const out = await runDueUploadVerifications();
      applySnapshot(out.snapshot);
      notice = `Đã đối chiếu ${out.checkedCount} mục đến hạn trong sổ kiểm tra.`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function toggleAutoSchedule(checked: boolean) {
    try {
      runtime = await setUploadAutoSchedule(checked);
      notice = checked
        ? 'Đã bật tự chạy lịch hẹn / đối chiếu nền mỗi 15 giây.'
        : 'Đã tắt tự chạy lịch hẹn nền.';
    } catch (cause) {
      error = String(cause);
    }
  }

  function openCreateDialog() {
    if (isBusy) return;
    createFolderPath = '';
    createScan = null;
    createMode = 'new';
    createAccount = runtime?.verifiedAccount || 'local-draft';
    createTitleVi = '';
    createTitleCn = '';
    createAuthorCn = '';
    createDescVi = '';
    createBookUrl = '';
    createVolumeName = 'Chính văn';
    createVolumeNote = '';
    createAppend = false;
    createCreditText = '';
    createCreditKind = 'end';
    createCreditLine = 2;
    createError = '';
    createDialog?.showModal();
  }

  async function pickCreateFolder() {
    if (isBusy) return;
    busy = 'scan';
    createError = '';
    try {
      const picked = await chooseUploadFolder();
      if (picked) {
        createScan = picked;
        createFolderPath = picked.folder;
      }
    } catch (cause) {
      createError = String(cause);
    } finally {
      busy = null;
    }
  }

  async function rescanCreateFolder() {
    if (isBusy || !createFolderPath.trim()) return;
    busy = 'scan';
    createError = '';
    try {
      createScan = await scanUploadFolder(createFolderPath.trim());
      createFolderPath = createScan.folder;
    } catch (cause) {
      createScan = null;
      createError = String(cause);
    } finally {
      busy = null;
    }
  }

  async function submitCreateJob() {
    if (isBusy) return;
    busy = 'create';
    createError = '';
    error = '';
    notice = '';
    try {
      const creditPosition: CreditPosition =
        createCreditKind === 'line' ? { line: Number(createCreditLine) || 1 } : createCreditKind;
      const beforeIds = new Set(jobs.map((j) => j.id));
      const next = await createUploadJob({
        folder: createFolderPath.trim(),
        mode: createMode,
        account: createAccount.trim(),
        titleVi: createTitleVi.trim(),
        titleCn: createTitleCn.trim(),
        authorCn: createAuthorCn.trim(),
        descVi: createDescVi,
        bookUrl: createBookUrl.trim(),
        volumeName: createVolumeName.trim(),
        volumeNote: createVolumeNote.trim(),
        append: createAppend,
        creditText: createCreditText,
        creditPosition,
      });
      const created = next.jobs.find((j) => !beforeIds.has(j.id));
      applySnapshot(next, created?.id);
      createDialog?.close();
      notice = `Đã tạo công việc «${created?.title ?? 'mới'}» ở trạng thái Dự kiến (chưa gửi mạng).`;
    } catch (cause) {
      createError = String(cause);
    } finally {
      busy = null;
    }
  }

  function openScheduleDialog() {
    if (!selectedJob || isBusy) return;
    scheduleDatetime = toDatetimeLocalValue(Date.now() + 10 * 60_000);
    scheduleAllowDup = false;
    scheduleConflictSeen = false;
    scheduleError = '';
    scheduleDialog?.showModal();
  }

  function bumpScheduleMinutes(minutes: number) {
    scheduleDatetime = toDatetimeLocalValue(Date.now() + minutes * 60_000);
  }

  async function submitSchedule() {
    if (!selectedJob || isBusy) return;
    const atMs = Date.parse(scheduleDatetime);
    if (!Number.isFinite(atMs)) {
      scheduleError = 'Hãy chọn thời điểm hẹn hợp lệ.';
      return;
    }
    busy = 'schedule';
    scheduleError = '';
    error = '';
    notice = '';
    try {
      const next = await scheduleUploadJob(selectedJob.id, Math.round(atMs), scheduleAllowDup);
      applySnapshot(next, selectedJob.id);
      scheduleDialog?.close();
      notice = `Đã đặt lịch công việc vào ${formatTimestamp(Math.round(atMs))}.`;
    } catch (cause) {
      const msg = String(cause);
      scheduleError = msg;
      if (msg.includes('đã có lịch chờ') || msg.includes('trùng')) {
        scheduleConflictSeen = true;
      }
    } finally {
      busy = null;
    }
  }

  function openLinkDialog() {
    if (!selectedJob || isBusy || !eligibleParents.length) return;
    linkParentId = eligibleParents[0].id;
    linkAllowDup = false;
    linkConflictSeen = false;
    linkError = '';
    linkDialog?.showModal();
  }

  async function submitLink() {
    if (!selectedJob || !linkParentId || isBusy) return;
    busy = 'link';
    linkError = '';
    error = '';
    notice = '';
    try {
      const next = await linkUploadJob(selectedJob.id, linkParentId, linkAllowDup);
      applySnapshot(next, selectedJob.id);
      linkDialog?.close();
      notice = 'Đã liên kết công việc chạy nối tiếp sau công việc trước.';
    } catch (cause) {
      const msg = String(cause);
      linkError = msg;
      if (msg.includes('còn lượt chờ') || msg.includes('trùng')) {
        linkConflictSeen = true;
      }
    } finally {
      busy = null;
    }
  }

  async function handleCancelSchedule() {
    if (!selectedJob || isBusy) return;
    busy = 'cancel';
    error = '';
    notice = '';
    try {
      const next = await cancelUploadSchedule(selectedJob.id);
      applySnapshot(next, selectedJob.id);
      notice = 'Đã hủy lịch / liên kết, đưa công việc về trạng thái Dự kiến.';
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function openRecoveryPreview() {
    if (!selectedJob || isBusy) return;
    busy = 'export';
    error = '';
    exportResultPath = '';
    try {
      recoveryReport = await previewUploadJobRecovery(selectedJob.id);
      await tick();
      exportDialog?.showModal();
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function exportRecoveryZip() {
    if (!selectedJob || isBusy) return;
    busy = 'export';
    error = '';
    try {
      const out = await exportUploadJobRecovery(selectedJob.id, `${selectedJob.title}-sao-luu.zip`);
      if (out) {
        recoveryReport = out.report;
        exportResultPath = out.path;
        notice = `Đã xuất gói sao lưu sạch vào ${out.path}`;
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function pickAndInspectBackup() {
    if (isBusy) return;
    busy = 'import';
    error = '';
    importError = '';
    try {
      const inspected = await pickUploadBackupZip();
      if (inspected) {
        backupInspection = inspected;
        importAccount = runtime?.verifiedAccount || 'local-draft';
        await tick();
        importDialog?.showModal();
      }
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function confirmRestoreBackup() {
    if (!backupInspection || isBusy) return;
    busy = 'import';
    importError = '';
    error = '';
    notice = '';
    try {
      const outcome = await restoreUploadBackupZip(backupInspection.path, importAccount.trim());
      applySnapshot(outcome.snapshot, outcome.restoredJobId);
      importDialog?.close();
      notice = `Đã khôi phục công việc «${backupInspection.report.title}» ở trạng thái Dự kiến an toàn.`;
    } catch (cause) {
      importError = String(cause);
    } finally {
      busy = null;
    }
  }

  async function confirmDeleteJob() {
    deleteDialog?.close();
    if (!selectedJob || isBusy) return;
    const removedTitle = selectedJob.title;
    busy = 'delete';
    error = '';
    notice = '';
    try {
      const next = await deleteUploadJob(selectedJob.id);
      applySnapshot(next);
      notice = `Đã xóa công việc «${removedTitle}».`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }

  async function handleCleanupStorage() {
    if (isBusy) return;
    busy = 'cleanup';
    error = '';
    notice = '';
    try {
      const out = await cleanupUploadStorage();
      applySnapshot(out.snapshot);
      notice = `Đã giải phóng ${out.report.releasedJobs} job hoàn tất cũ và dọn ${out.report.swept.files} tệp thừa (${formatBytes(out.report.swept.bytes)}).`;
    } catch (cause) {
      error = String(cause);
    } finally {
      busy = null;
    }
  }
</script>

<section class="heading">
  <div>
    <h1>Đăng tải &amp; Khôi phục</h1>
    <p>
      Quản lý kế hoạch đăng truyện, giữ nguyên tệp gốc, truyền stream UTF-8 BOM an toàn, đối chiếu server và sao lưu ZIP sạch.
    </p>
  </div>
  <div class="proof-actions heading-actions">
    <button
      class="button session-pill"
      class:connected={Boolean(runtime?.verifiedAccount)}
      type="button"
      onclick={openSessionDialog}
      disabled={isBusy}
    >
      <span class="session-dot" aria-hidden="true"></span>
      <span>{sessionPillLabel}</span>
      {#if runtime?.mockMode}
        <span class="badge accent">Mock</span>
      {/if}
    </button>
    <button
      class="button"
      type="button"
      title="Nhập gói ZIP sao lưu công việc"
      onclick={pickAndInspectBackup}
      disabled={isBusy}
    >
      {busy === 'import' ? 'Đang mở…' : 'Nhập ZIP'}
    </button>
    <button class="button primary" type="button" onclick={openCreateDialog} disabled={isBusy}>
      Tạo công việc
    </button>
  </div>
</section>

{#if showCrashBanner && crashRecovery}
  <div class="notice error crash-banner" role="alert">
    <div>
      <strong>Phục hồi sau sự cố:</strong>
      {#if crashRecovery.uncertainIds.length > 0}
        Đã chuyển {crashRecovery.uncertainIds.length} công việc từng gửi dữ liệu sang <em>Cần kiểm tra</em> (khóa tự retry để tránh đăng trùng).
      {/if}
      {#if crashRecovery.failedIds.length > 0}
        Đã chuyển {crashRecovery.failedIds.length} công việc chưa gửi sang <em>Tạm dừng</em>.
      {/if}
    </div>
    <button type="button" class="mini-btn" onclick={() => (recoveryDismissed = true)}>Đã hiểu</button>
  </div>
{/if}

{#if error}
  <p role="alert" class="notice error standalone-notice">{error}</p>
{/if}
{#if notice}
  <p role="status" class="notice standalone-notice">{notice}</p>
{/if}

<div class="workspace">
  <aside class="shelf" aria-label="Danh sách công việc đăng tải">
    <div class="shelf-head">
      <div class="shelf-title-row">
        <h2>Công việc ({jobs.length})</h2>
        <button type="button" class="inline-action" onclick={refreshWorkspace} disabled={isBusy}>
          {busy === 'load' ? 'Đang tải…' : 'Làm mới'}
        </button>
      </div>
      <input
        type="search"
        aria-label="Lọc công việc đăng tải"
        placeholder="Tìm tên truyện, tài khoản…"
        bind:value={query}
      />
      <div class="filter-pills" role="group" aria-label="Lọc theo trạng thái">
        <button type="button" class:active={statusFilter === 'all'} onclick={() => (statusFilter = 'all')}>
          Tất cả
        </button>
        <button type="button" class:active={statusFilter === 'pending'} onclick={() => (statusFilter = 'pending')}>
          Đang chờ
        </button>
        <button type="button" class:active={statusFilter === 'attention'} onclick={() => (statusFilter = 'attention')}>
          Cần xử lý
        </button>
        <button type="button" class:active={statusFilter === 'complete'} onclick={() => (statusFilter = 'complete')}>
          Hoàn tất
        </button>
      </div>
    </div>

    {#if visibleJobs.length}
      <ul class="shelf-items">
        {#each visibleJobs as job (job.id)}
          <li>
            <button
              type="button"
              aria-pressed={selectedId === job.id}
              disabled={isBusy}
              onclick={() => {
                selectedId = job.id;
                chapterPage = 0;
              }}
            >
              <div class="job-row-top">
                <span class="job-title">{job.title}</span>
                <span class={`badge ${statusTone(job.status)}`}>{statusLabel(job.status)}</span>
              </div>
              <div class="job-row-meta">
                <small>{job.account} · {job.mode === 'new' ? 'Truyện mới' : 'Thêm chương'}</small>
                <small class="num-stat">{job.chapterCount} ch · {job.progress.percent}%</small>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="shelf-empty">
        {busy === 'load'
          ? 'Đang tải danh sách công việc…'
          : jobs.length
            ? 'Không có công việc khớp bộ lọc.'
            : 'Chưa có công việc nào. Tạo công việc từ thư mục .txt hoặc nhập ZIP sao lưu.'}
      </p>
    {/if}

    {#if snapshot}
      <div class="shelf-foot">
        <div class="stat-box">
          <div><span>Lịch hẹn / liên kết</span><strong class="num-stat">{snapshot.schedules.length}</strong></div>
          <div><span>Sổ đối chiếu</span><strong class="num-stat">{snapshot.ledgerCount}</strong></div>
          <div>
            <span>Kho đối tượng cục bộ</span>
            <strong class="num-stat">{snapshot.storage.objectFiles} tệp · {formatBytes(snapshot.storage.objectBytes)}</strong>
          </div>
        </div>
        <label class="checkbox-field auto-sched-check">
          <input
            type="checkbox"
            checked={Boolean(runtime?.autoScheduleEnabled)}
            onchange={(e) => toggleAutoSchedule(e.currentTarget.checked)}
          />
          <span>Tự chạy lịch hẹn &amp; đối chiếu nền</span>
        </label>
        <div class="foot-actions">
          {#if snapshot.ledgerCount > 0}
            <button
              type="button"
              class="button subtle"
              onclick={handleRunDueVerifications}
              disabled={isBusy || anyRunActive}
            >
              {busy === 'verify' ? 'Đang kiểm tra…' : 'Đối chiếu đến hạn'}
            </button>
          {/if}
          <button type="button" class="button subtle" onclick={handleCleanupStorage} disabled={isBusy}>
            {busy === 'cleanup' ? 'Đang dọn…' : 'Dọn tệp thừa'}
          </button>
        </div>
      </div>
    {/if}
  </aside>

  <section class="proof" aria-label="Chi tiết công việc đăng tải" aria-busy={isBusy}>
    {#if selectedJob}
      <header class="proof-head">
        <div class="job-head-info">
          <div class="job-title-line">
            <h2>{selectedJob.title}</h2>
            <span class={`badge ${statusTone(selectedJob.status)}`}>{statusLabel(selectedJob.status)}</span>
            <span class="badge">{selectedJob.mode === 'new' ? 'Truyện mới' : 'Thêm chương'}</span>
          </div>
          <p class="summary num-stat">
            {activeRunForSelected ? activeRunForSelected.phase : selectedJob.progress.phase}
            · {activeRunForSelected && activeRunForSelected.total > 0
              ? `${Math.ceil(activeRunForSelected.bytes / 1024)}/${Math.ceil(activeRunForSelected.total / 1024)} KB`
              : selectedJob.progress.detail}
            · Tài khoản: {selectedJob.account}
          </p>
        </div>
        <div class="proof-actions">
          <button
            type="button"
            class="button subtle"
            disabled={isBusy || !selectedJob.canExportRecovery}
            onclick={openRecoveryPreview}
          >
            Sao lưu ZIP
          </button>
          <button
            type="button"
            class="button subtle"
            disabled={isBusy || !selectedJob.canDelete}
            title={selectedJob.deleteBlockReason ?? 'Xóa công việc khỏi danh sách'}
            onclick={() => deleteDialog?.showModal()}
          >
            Xóa
          </button>
        </div>
      </header>

      {#if selectedJob.status === 'uncertain' || selectedJob.needsReconcile}
        <p class="notice error" role="alert">
          <strong>Cần đối chiếu trước khi gửi lại:</strong> Không tự động retry request ghi vì đã đánh dấu có tương tác với server. Hãy dùng <em>Đối chiếu ngay</em> hoặc sao lưu ZIP trước khi thao tác tiếp.
        </p>
      {/if}

      {#if selectedJob.uploadIssue}
        <p class="notice error" role="alert">{selectedJob.uploadIssue}</p>
      {/if}

      {#if selectedJob.error && selectedJob.error !== selectedJob.uploadIssue}
        <p class="notice error" role="alert">{selectedJob.error}</p>
      {/if}

      {#if selectedJob.pendingConflicts.length > 0}
        <p class="notice error" role="status">
          Cảnh báo chống trùng: Phát hiện {selectedJob.pendingConflicts.length} công việc khác cùng truyện đang chờ trong hàng đợi/lịch hẹn.
        </p>
      {/if}

      {#if selectedJob.validation.errors.length > 0}
        <p class="notice error" role="alert">{selectedJob.validation.errors.join(' · ')}</p>
      {:else if selectedJob.validation.warnings.length > 0}
        <p class="notice" role="status">Lưu ý chương: {selectedJob.validation.warnings.join(' · ')}</p>
      {/if}

      {#if selectedJob.verificationMessage || selectedJob.scheduleMessage}
        <p class="notice" role="status">
          {[selectedJob.verificationMessage, selectedJob.scheduleMessage].filter(Boolean).join(' · ')}
        </p>
      {/if}

      <div class="proof-body detail-body">
        <div class="progress-row">
          <progress
            class="upload-progress"
            value={activeRunForSelected ? activeRunForSelected.percent : selectedJob.progress.percent}
            max="100"
          ></progress>
          <span class="num-stat">
            {activeRunForSelected ? activeRunForSelected.percent : selectedJob.progress.percent}%
          </span>
        </div>

        <dl class="meta-grid">
          <div>
            <dt>Tài khoản</dt>
            <dd>{selectedJob.account}</dd>
          </div>
          <div>
            <dt>Khởi tạo</dt>
            <dd class="num-stat">{formatTimestamp(selectedJob.createdAt)}</dd>
          </div>
          <div>
            <dt>Hẹn giờ / Liên kết</dt>
            <dd class="num-stat">
              {#if selectedJob.scheduledAt}
                Hẹn: {formatTimestamp(selectedJob.scheduledAt)}
              {:else if selectedJob.afterJobId}
                Nối tiếp sau: <code>{selectedJob.afterJobId}</code>
              {:else}
                Chưa đặt lịch
              {/if}
            </dd>
          </div>
          <div>
            <dt>Tệp cục bộ</dt>
            <dd class="num-stat">
              {#if selectedJob.filesReleased}
                Đã giải phóng dung lượng sau hoàn tất
              {:else}
                {selectedJob.availableChapterCount}/{selectedJob.chapterCount} chương · {formatBytes(selectedJob.totalBytes)}
              {/if}
            </dd>
          </div>
          {#if selectedJob.bookUrl || selectedJob.publishedUrl}
            <div class="meta-wide">
              <dt>Đường dẫn truyện</dt>
              <dd><code>{selectedJob.publishedUrl || selectedJob.bookUrl}</code></dd>
            </div>
          {/if}
        </dl>

        {#if selectedJob.volumes.length > 0}
          <div class="section-block">
            <h3>Kế hoạch quyển ({selectedJob.volumes.length})</h3>
            <ul class="volume-list">
              {#each selectedJob.volumes as vol (vol.key)}
                <li class="volume-card">
                  <div>
                    <strong>{vol.name}</strong>
                    <small>
                      {vol.chapterCount} chương
                      {vol.append ? ' · Bổ sung vào quyển' : ''}
                      {vol.note ? ` · ${vol.note}` : ''}
                    </small>
                  </div>
                  <span class="badge accent">{volumeStatusLabel(vol.status)}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if selectedJob.chapters.length > 0}
          <div class="section-block">
            <h3>Danh sách chương đã chuẩn bị ({selectedJob.chapters.length})</h3>
            {#if totalChapterPages > 1}
              <div class="pager">
                <button
                  type="button"
                  class="button subtle"
                  disabled={clampedChapterPage === 0 || isBusy}
                  onclick={() => (chapterPage = Math.max(0, clampedChapterPage - 1))}
                >
                  ← Trang trước
                </button>
                <span>
                  Trang {clampedChapterPage + 1} / {totalChapterPages} ({selectedJob.chapters.length} chương)
                </span>
                <button
                  type="button"
                  class="button subtle"
                  disabled={clampedChapterPage >= totalChapterPages - 1 || isBusy}
                  onclick={() => (chapterPage = Math.min(totalChapterPages - 1, clampedChapterPage + 1))}
                >
                  Trang sau →
                </button>
              </div>
            {/if}
            <table>
              <thead>
                <tr>
                  <th class="idx-col" scope="col">#</th>
                  <th scope="col">Tên chương</th>
                  <th class="size-col" scope="col">Kích thước</th>
                  <th class="state-col" scope="col">Bản lưu</th>
                </tr>
              </thead>
              <tbody>
                {#each pagedChapters as ch, idx (ch.id)}
                  <tr>
                    <td class="idx-col num-stat">{clampedChapterPage * CHAPTER_PAGE_SIZE + idx + 1}</td>
                    <td>
                      <span class="filename">{ch.title}</span>
                      <small>
                        {ch.number !== null ? `Số ${ch.number}` : 'Không đánh số'}
                        {ch.hasOriginal ? ' · Có bản gốc trước khi chèn credit' : ''}
                      </small>
                    </td>
                    <td class="size-col num-stat">{formatBytes(ch.bytes)}</td>
                    <td class="state-col">
                      <span class={`badge ${ch.available ? 'accent' : 'warn'}`}>
                        {ch.available ? 'Sẵn sàng' : 'Thiếu tệp'}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <footer class="proof-footer">
        <span>
          {#if activeRunForSelected}
            Đang truyền stream multipart (UTF-8 BOM trên đường truyền)…
          {:else if selectedJob.status === 'uncertain'}
            Đã khóa gửi tự động cho tới khi đối chiếu với server
          {:else if selectedJob.status === 'waiting'}
            Đã tải xong bước gửi · có thể bấm Đối chiếu ngay để kiểm tra server
          {:else if selectedJob.scheduleBlockReason && !selectedJob.canSchedule}
            {selectedJob.scheduleBlockReason}
          {:else}
            Sẵn sàng hẹn lịch hoặc gửi theo xác nhận người dùng
          {/if}
        </span>
        <div class="proof-actions">
          {#if activeRunForSelected}
            <button type="button" class="button" onclick={handleStopActive}>
              Dừng tải
            </button>
          {:else}
            {#if selectedJob.status === 'waiting' || selectedJob.status === 'uncertain'}
              <button type="button" class="button" disabled={isBusy || anyRunActive} onclick={handleVerifySelected}>
                {busy === 'verify' ? 'Đang đối chiếu…' : 'Đối chiếu ngay'}
              </button>
            {/if}
            {#if selectedJob.status === 'scheduled' || selectedJob.status === 'linked'}
              <button type="button" class="button" disabled={isBusy || anyRunActive} onclick={handleCancelSchedule}>
                {busy === 'cancel' ? 'Đang hủy…' : selectedJob.status === 'linked' ? 'Hủy liên kết' : 'Hủy lịch'}
              </button>
            {/if}
            {#if selectedJob.canSchedule}
              <button
                type="button"
                class="button"
                disabled={isBusy || anyRunActive || !eligibleParents.length}
                onclick={openLinkDialog}
                title={eligibleParents.length ? 'Chạy sau khi một công việc cùng tài khoản hoàn tất' : 'Chưa có công việc trước cùng tài khoản'}
              >
                Liên kết sau…
              </button>
              <button
                type="button"
                class="button"
                disabled={isBusy || anyRunActive}
                onclick={openScheduleDialog}
              >
                {selectedJob.status === 'scheduled' ? 'Đổi lịch…' : 'Hẹn giờ đăng…'}
              </button>
            {/if}
            {#if selectedJob.status === 'planned' || selectedJob.status === 'failed'}
              <button
                type="button"
                class="button primary"
                disabled={isBusy || anyRunActive}
                onclick={openStartConfirm}
              >
                {selectedJob.retryLabel === 'Thử lại' ? 'Thử lại…' : 'Bắt đầu tải lên…'}
              </button>
            {/if}
          {/if}
        </div>
      </footer>
    {:else}
      <div class="empty">
        <div class="paper" aria-hidden="true"><span></span><span></span><span></span></div>
        <h3>Quản lý công việc Upload &amp; Khôi phục</h3>
        <p>
          Tạo công việc mới từ thư mục tệp .txt (giữ nguyên file gốc), cấu hình phiên đăng nhập DPAPI hoặc nhập lại từ gói ZIP sao lưu.
        </p>
      </div>
    {/if}
  </section>
</div>

<dialog bind:this={sessionDialog} aria-labelledby="session-dialog-title">
  <h2 id="session-dialog-title">Phiên đăng nhập {snapshot?.allowedHost ?? 'wikicv.org'}</h2>
  <p>
    Cookie phiên được mã hóa riêng theo tài khoản Windows bằng <strong>Windows DPAPI</strong> (<code>session.dpapi</code>), không lưu bản rõ vào state hoặc gói ZIP sao lưu.
  </p>

  {#if sessionError}
    <p role="alert" class="notice error modal-notice">{sessionError}</p>
  {/if}

  {#if sessionCheck}
    <p role="status" class="notice modal-notice" class:error={!sessionCheck.authenticated}>
      {sessionCheck.message}
    </p>
  {/if}

  <div class="stat-box scan-summary">
    <div>
      <span>Trạng thái lưu cục bộ</span>
      <strong>
        {#if sessionStatus?.configured && sessionStatus.readable}
          Đã lưu ({sessionStatus.masked})
        {:else if sessionStatus?.configured}
          Lỗi giải mã DPAPI
        {:else}
          Chưa cấu hình
        {/if}
      </strong>
    </div>
    <div>
      <span>Tài khoản đã xác thực</span>
      <strong>{runtime?.verifiedAccount || 'Chưa kiểm tra'}</strong>
    </div>
  </div>

  <div class="modal-form">
    <label for="session-cookie-input">Dán chuỗi Cookie mới</label>
    <textarea
      id="session-cookie-input"
      rows="3"
      bind:value={sessionCookieInput}
      placeholder="connect.sid=...; ..."
    ></textarea>
  </div>

  <div class="dialog-actions">
    {#if sessionStatus?.configured}
      <button type="button" class="button" onclick={handleClearSession} disabled={isBusy}>
        Xóa phiên
      </button>
    {/if}
    <button
      type="button"
      class="button"
      onclick={handleCheckSession}
      disabled={isBusy || !sessionStatus?.configured}
    >
      {busy === 'session' ? 'Đang kiểm tra…' : 'Kiểm tra phiên'}
    </button>
    <button
      type="button"
      class="button primary"
      onclick={handleSaveSession}
      disabled={isBusy || !sessionCookieInput.trim()}
    >
      Lưu phiên (DPAPI)
    </button>
    <button type="button" class="button" onclick={() => sessionDialog?.close()}>Đóng</button>
  </div>
</dialog>

<dialog bind:this={startConfirmDialog} aria-labelledby="start-confirm-title">
  <h2 id="start-confirm-title">Xác nhận bắt đầu tải lên</h2>
  {#if selectedJob}
    <p>
      Chuẩn bị gửi <strong>{selectedJob.title}</strong> ({selectedJob.chapterCount} chương · {formatBytes(selectedJob.totalBytes)}) bằng tài khoản <strong>{selectedJob.account}</strong>.
    </p>
    <p>
      Nếu rớt kết nối giữa chừng khi đang gửi dữ liệu, hệ thống sẽ chuyển sang <em>Chờ xác nhận / Cần kiểm tra</em> để đối chiếu, không tự gửi lặp tránh trùng chương.
    </p>

    {#if selectedJob.pendingConflicts.length > 0}
      <p role="alert" class="notice error modal-notice">
        Phát hiện {selectedJob.pendingConflicts.length} công việc cùng truyện đang ở trạng thái chờ.
      </p>
      <label class="checkbox-field">
        <input type="checkbox" bind:checked={startConflictConsent} />
        <span>Tôi đã kiểm tra và xác nhận vẫn muốn tải lên</span>
      </label>
    {/if}
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => startConfirmDialog?.close()} disabled={isBusy}>
      Hủy
    </button>
    <button
      type="button"
      class="button primary"
      onclick={confirmStartNow}
      disabled={isBusy || !startConflictConsent}
    >
      Xác nhận gửi
    </button>
  </div>
</dialog>

<dialog class="wide-dialog" bind:this={createDialog} aria-labelledby="create-job-title">
  <h2 id="create-job-title">Tạo công việc đăng tải mới</h2>
  <p>Tệp gốc trên đĩa được giữ nguyên; hệ thống tạo bản sao UTF-8 an toàn trong kho cục bộ.</p>

  {#if createError}
    <p role="alert" class="notice error modal-notice">{createError}</p>
  {/if}

  <div class="modal-form">
    <label for="create-folder">Thư mục chứa các chương (.txt)</label>
    <div class="folder-pick-row">
      <input
        id="create-folder"
        type="text"
        bind:value={createFolderPath}
        placeholder="Chọn hoặc dán đường dẫn thư mục…"
      />
      <button type="button" class="button subtle" onclick={pickCreateFolder} disabled={isBusy}>
        {busy === 'scan' ? 'Đang mở…' : 'Chọn…'}
      </button>
      <button type="button" class="button subtle" onclick={rescanCreateFolder} disabled={isBusy || !createFolderPath.trim()}>
        Quét
      </button>
    </div>

    {#if createScan}
      <div class="stat-box scan-summary">
        <div>
          <span>Số chương tìm thấy</span>
          <strong class="num-stat">{createScan.chapters.length} chương · {formatBytes(createScan.validation.bytes)}</strong>
        </div>
        {#if createScan.validation.errors.length > 0}
          <div class="warn-stat">
            <span>Lỗi kiểm tra</span>
            <strong>{createScan.validation.errors.join(' · ')}</strong>
          </div>
        {/if}
        {#if createScan.validation.warnings.length > 0}
          <div class="warn-stat">
            <span>Cảnh báo thứ tự</span>
            <strong>{createScan.validation.warnings.join(' · ')}</strong>
          </div>
        {/if}
      </div>
    {/if}

    <div class="two-col">
      <div>
        <label for="create-mode">Chế độ công việc</label>
        <select id="create-mode" bind:value={createMode}>
          <option value="new">Đăng truyện mới</option>
          <option value="existing">Thêm chương vào truyện có sẵn</option>
        </select>
      </div>
      <div>
        <label for="create-account">Tài khoản quản lý</label>
        <input id="create-account" type="text" bind:value={createAccount} placeholder="vd: demo-account" />
      </div>
    </div>

    {#if createMode === 'existing'}
      <label for="create-book-url">Link truyện trên {snapshot?.allowedHost ?? 'wikicv.org'}</label>
      <input
        id="create-book-url"
        type="url"
        bind:value={createBookUrl}
        placeholder="https://wikicv.org/truyen/ten-truyen"
      />
    {/if}

    <div class="two-col">
      <div>
        <label for="create-title-vi">Tên truyện tiếng Việt</label>
        <input id="create-title-vi" type="text" bind:value={createTitleVi} placeholder="Tên hiển thị / bản dịch" />
      </div>
      <div>
        <label for="create-title-cn">Tên truyện tiếng Trung</label>
        <input id="create-title-cn" type="text" bind:value={createTitleCn} placeholder="Dùng để chống trùng lịch hẹn" />
      </div>
    </div>

    <div class="two-col">
      <div>
        <label for="create-author-cn">Tác giả tiếng Trung</label>
        <input id="create-author-cn" type="text" bind:value={createAuthorCn} placeholder="Tên tác giả gốc" />
      </div>
      <div>
        <label for="create-volume-name">Tên quyển</label>
        <input id="create-volume-name" type="text" bind:value={createVolumeName} placeholder="Chính văn" />
      </div>
    </div>

    {#if createMode === 'new'}
      <label for="create-desc-vi">Giới thiệu truyện</label>
      <textarea id="create-desc-vi" rows="2" bind:value={createDescVi} placeholder="Tự động chuẩn hóa xuống dòng đôi khi đóng gói"></textarea>
    {:else}
      <div class="two-col">
        <div>
          <label for="create-volume-note">Ghi chú bổ sung (descCn)</label>
          <input id="create-volume-note" type="text" bind:value={createVolumeNote} placeholder="vd: 101-150" />
        </div>
        <label class="checkbox-field modal-check">
          <input type="checkbox" bind:checked={createAppend} />
          <span>Chế độ bổ sung vào quyển hiện có</span>
        </label>
      </div>
    {/if}

    <details>
      <summary>Chèn dòng giới thiệu / credit trên bản tải lên (giữ nguyên file gốc)</summary>
      <label for="create-credit">Nội dung dòng credit</label>
      <textarea id="create-credit" rows="2" bind:value={createCreditText} placeholder="Ví dụ: Sưu tầm &amp; biên tập tại Novel Studio"></textarea>
      <div class="two-col">
        <div>
          <label for="create-credit-pos">Vị trí chèn</label>
          <select id="create-credit-pos" bind:value={createCreditKind}>
            <option value="end">Cuối mỗi chương</option>
            <option value="start">Đầu mỗi chương</option>
            <option value="line">Sau dòng số…</option>
          </select>
        </div>
        {#if createCreditKind === 'line'}
          <div>
            <label for="create-credit-line">Số dòng</label>
            <input id="create-credit-line" type="number" min="1" bind:value={createCreditLine} />
          </div>
        {/if}
      </div>
    </details>
  </div>

  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => createDialog?.close()} disabled={isBusy}>Hủy</button>
    <button
      type="button"
      class="button primary"
      onclick={submitCreateJob}
      disabled={isBusy || !createScan || createScan.chapters.length === 0 || createScan.validation.errors.length > 0}
    >
      {busy === 'create' ? 'Đang tạo…' : 'Tạo công việc'}
    </button>
  </div>
</dialog>

<dialog bind:this={scheduleDialog} aria-labelledby="schedule-dialog-title">
  <h2 id="schedule-dialog-title">Hẹn giờ công việc</h2>
  <p>{selectedJob?.title}. Chỉ nhận lịch hợp lệ từ 1 phút đến 1 năm tới.</p>

  {#if scheduleError}
    <p role="alert" class="notice error modal-notice">{scheduleError}</p>
  {/if}

  <div class="modal-form">
    <label for="schedule-dt">Thời điểm dự kiến</label>
    <input id="schedule-dt" type="datetime-local" bind:value={scheduleDatetime} />
    <div class="tokens" aria-label="Chọn nhanh thời gian">
      <button type="button" onclick={() => bumpScheduleMinutes(5)}>+5 phút</button>
      <button type="button" onclick={() => bumpScheduleMinutes(30)}>+30 phút</button>
      <button type="button" onclick={() => bumpScheduleMinutes(60)}>+1 giờ</button>
    </div>

    {#if scheduleConflictSeen || (selectedJob && selectedJob.pendingConflicts.length > 0)}
      <label class="checkbox-field">
        <input type="checkbox" bind:checked={scheduleAllowDup} />
        <span>Tôi đã kiểm tra và xác nhận cho phép đặt lịch trùng truyện này</span>
      </label>
    {/if}
  </div>

  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => scheduleDialog?.close()} disabled={isBusy}>Hủy</button>
    <button type="button" class="button primary" onclick={submitSchedule} disabled={isBusy}>
      {busy === 'schedule' ? 'Đang lưu lịch…' : 'Xác nhận hẹn giờ'}
    </button>
  </div>
</dialog>

<dialog bind:this={linkDialog} aria-labelledby="link-dialog-title">
  <h2 id="link-dialog-title">Liên kết chạy nối tiếp</h2>
  <p>Công việc này sẽ chỉ chuyển sang sẵn sàng sau khi công việc trước hoàn tất xác nhận.</p>

  {#if linkError}
    <p role="alert" class="notice error modal-notice">{linkError}</p>
  {/if}

  <div class="modal-form">
    <label for="link-parent">Công việc đứng trước (cùng tài khoản)</label>
    <select id="link-parent" bind:value={linkParentId}>
      {#each eligibleParents as parent (parent.id)}
        <option value={parent.id}>{parent.title} ({statusLabel(parent.status)})</option>
      {/each}
    </select>

    {#if linkConflictSeen || (selectedJob && selectedJob.pendingConflicts.length > 0)}
      <label class="checkbox-field">
        <input type="checkbox" bind:checked={linkAllowDup} />
        <span>Tôi xác nhận liên kết dù cùng định danh truyện đang chờ</span>
      </label>
    {/if}
  </div>

  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => linkDialog?.close()} disabled={isBusy}>Hủy</button>
    <button type="button" class="button primary" onclick={submitLink} disabled={isBusy || !linkParentId}>
      {busy === 'link' ? 'Đang liên kết…' : 'Xác nhận liên kết'}
    </button>
  </div>
</dialog>

<dialog class="wide-dialog" bind:this={exportDialog} aria-labelledby="export-recovery-title">
  <h2 id="export-recovery-title">Xem trước gói sao lưu &amp; Lấy lại dữ liệu</h2>
  {#if recoveryReport}
    <p>
      {recoveryReport.title} · Còn {recoveryReport.availableChapters} chương
      {#if recoveryReport.missingChapters > 0}
        · Thiếu {recoveryReport.missingChapters} chương
      {/if}
      · Đã loại bỏ cookie/CSRF/token nhạy cảm.
    </p>
    <pre class="archive-preview-body">{recoveryReport.text}</pre>
    {#if exportResultPath}
      <p class="notice modal-notice" role="status">Đã lưu: <code>{exportResultPath}</code></p>
    {/if}
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => exportDialog?.close()}>Đóng</button>
    <button type="button" class="button primary" onclick={exportRecoveryZip} disabled={isBusy || !recoveryReport}>
      {busy === 'export' ? 'Đang xuất ZIP…' : 'Xuất tệp ZIP…'}
    </button>
  </div>
</dialog>

<dialog bind:this={importDialog} aria-labelledby="import-backup-title">
  <h2 id="import-backup-title">Khôi phục công việc từ ZIP sao lưu</h2>
  {#if backupInspection}
    <p>
      <strong>{backupInspection.report.title}</strong> · {backupInspection.report.volumes.length} quyển ·
      {backupInspection.report.availableChapters} chương sẵn sàng
      {#if backupInspection.report.missingChapters > 0}
        ({backupInspection.report.missingChapters} thiếu)
      {/if}.
    </p>
    <pre class="archive-preview-body">{backupInspection.report.text}</pre>
    {#if importError}
      <p role="alert" class="notice error modal-notice">{importError}</p>
    {/if}
    <div class="modal-form">
      <label for="import-account">Tài khoản nhận công việc khôi phục</label>
      <input id="import-account" type="text" bind:value={importAccount} />
    </div>
  {/if}
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => importDialog?.close()} disabled={isBusy}>Hủy</button>
    <button type="button" class="button primary" onclick={confirmRestoreBackup} disabled={isBusy || !importAccount.trim()}>
      {busy === 'import' ? 'Đang khôi phục…' : 'Khôi phục về Dự kiến'}
    </button>
  </div>
</dialog>

<dialog bind:this={deleteDialog} aria-labelledby="delete-job-title">
  <h2 id="delete-job-title">Xóa công việc?</h2>
  <p>
    {selectedJob?.title}.
    {#if selectedJob?.writeAttempted}
      Công việc này từng gửi dữ liệu lên server. Nên xuất sao lưu ZIP trước khi xóa khỏi danh sách.
    {:else}
      Công việc sẽ bị xóa khỏi hàng đợi cục bộ; tệp nguồn ban đầu trên máy vẫn giữ nguyên.
    {/if}
  </p>
  <div class="dialog-actions">
    <button type="button" class="button" onclick={() => deleteDialog?.close()}>Hủy</button>
    <button type="button" class="button primary" onclick={confirmDeleteJob}>Xác nhận xóa</button>
  </div>
</dialog>

<style>
  .heading-actions {
    flex-shrink: 0;
  }

  .session-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    white-space: nowrap;
  }
  .session-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--muted);
    opacity: 0.55;
    flex-shrink: 0;
  }
  .session-pill.connected .session-dot {
    background: var(--accent);
    opacity: 1;
  }

  .crash-banner,
  .standalone-notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    margin-bottom: 14px;
  }
  .crash-banner {
    border-color: var(--warning-border);
  }

  .shelf {
    min-width: 0;
    padding: 0;
    overflow: hidden;
  }
  .shelf-head {
    display: grid;
    gap: 10px;
    padding: 16px;
  }
  .shelf-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .filter-pills button {
    padding: 3px 9px;
    min-height: 26px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--inset);
    color: var(--muted);
    font-size: 11.5px;
    font-weight: 600;
  }
  .filter-pills button.active {
    background: var(--selection);
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  }

  .shelf-items {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 36vh;
    overflow: auto;
  }
  .shelf-items button {
    width: 100%;
    min-height: 58px;
    display: grid;
    gap: 5px;
    padding: 9px 14px;
    text-align: start;
    border: 0;
    border-top: 1px solid var(--line);
    background: var(--sheet);
    color: var(--ink);
    font-weight: 600;
    transition: background-color var(--motion-fast) var(--ease-out);
  }
  .shelf-items button:hover:not(:disabled) {
    background: var(--inset);
  }
  .shelf-items button[aria-pressed='true'] {
    background: var(--selection);
    color: var(--accent);
    box-shadow: inset 3px 0 var(--accent);
  }
  .job-row-top,
  .job-row-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .job-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .job-row-top .badge {
    flex-shrink: 0;
    white-space: nowrap;
  }
  .shelf-items button[aria-pressed='true'] .badge.accent {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 42%, var(--line));
  }
  .job-row-meta small {
    color: var(--muted);
    font-size: 11.5px;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .shelf-empty {
    padding: 4px 16px 14px;
    color: var(--muted);
    font-size: 13px;
  }
  .shelf-foot {
    padding: 0 16px 16px;
    border-top: 1px solid var(--line);
  }
  .auto-sched-check {
    margin-top: 10px;
    font-size: 12.5px;
  }
  .foot-actions {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }
  .foot-actions button {
    width: 100%;
  }

  .job-head-info {
    min-width: 0;
  }
  .job-title-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .job-title-line h2 {
    overflow-wrap: anywhere;
  }
  .detail-body {
    padding-bottom: 12px;
  }
  .progress-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 12px var(--space-panel) 8px;
  }
  .upload-progress {
    width: 100%;
    height: 8px;
    appearance: none;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--inset);
    overflow: hidden;
  }
  .upload-progress::-webkit-progress-bar {
    background: var(--inset);
  }
  .upload-progress::-webkit-progress-value {
    background: var(--accent);
    border-radius: 999px;
  }
  .upload-progress::-moz-progress-bar {
    background: var(--accent);
    border-radius: 999px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding: 4px var(--space-panel) 12px;
  }
  .meta-grid > div {
    background: var(--inset);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    min-width: 0;
  }
  .meta-wide {
    grid-column: 1 / -1;
  }
  .meta-grid dt {
    font-size: 11px;
    font-weight: 650;
    color: var(--muted);
  }
  .meta-grid dd {
    margin: 3px 0 0;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .section-block {
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }
  .section-block h3 {
    padding: 0 var(--space-panel) 8px;
    font-size: 13px;
    font-weight: 650;
    color: var(--muted);
  }
  .volume-list {
    list-style: none;
    margin: 0;
    padding: 0 var(--space-panel) 12px;
    display: grid;
    gap: 8px;
  }
  .volume-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--sheet-elevated);
  }
  .volume-card strong {
    display: block;
    font-size: 13.5px;
  }
  .volume-card small {
    color: var(--muted);
    font-size: 12px;
  }

  .proof-footer {
    flex-wrap: wrap;
  }
  .idx-col {
    width: 48px;
    color: var(--muted);
  }
  .state-col {
    width: 108px;
    text-align: right;
  }
  .num-stat {
    font-variant-numeric: tabular-nums;
  }

  .wide-dialog {
    width: min(640px, calc(100vw - 24px));
  }
  .modal-notice {
    margin-top: 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
  }
  .modal-form {
    margin-top: 8px;
  }
  .folder-pick-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 6px;
    align-items: center;
  }
  .scan-summary {
    margin-top: 10px;
  }
  .two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .modal-check {
    margin-top: 32px;
  }

  @media (max-width: 680px) {
    .meta-grid,
    .two-col,
    .folder-pick-row {
      grid-template-columns: 1fr;
    }
    .modal-check {
      margin-top: 10px;
    }
  }
</style>
