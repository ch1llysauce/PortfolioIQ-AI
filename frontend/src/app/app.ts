import { Component, signal, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';

import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { ProjectService } from './services/project.service';
import { SkillService, Skill } from './services/skill.service';
import { CareerRoleService, CareerRole } from './services/career-role.service';
import { AnalyticsService, SkillGapResponse, PortfolioScoreResponse } from './services/analytics.service';
import { MlService, ClassifyProjectResponse } from './services/ml.service';
import { OptimizationService, OptimizationResponse, RecommendedProject } from './services/optimization.service';
import { KnowledgeService, KnowledgeGraphData, RoleSkillTreeResponse, LearningPathResponse } from './services/knowledge.service';
import { CoachService, ChatMessage, PortfolioContext, CoachStatus } from './services/coach.service';
import { GitHubService, GitHubScanResponse, GitHubRepository, GitHubStatus } from './services/github.service';
import { SystemService, SystemTelemetryResponse } from './services/system.service';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'danger' | 'warning' | 'primary' | 'success';
  icon: 'logout' | 'delete' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Navigation State
  activeTab = signal<string>('dashboard');
  mobileSidebarOpen = signal<boolean>(false);

  // Global Confirmation Dialog
  confirmDialog = signal<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    icon: 'warning',
    onConfirm: () => {}
  });

  // Connection & Auth
  backendStatus = signal<string>('Checking backend...');
  backendConnected = signal<boolean>(false);
  currentUser = signal<any>(null);

  // Data Signals
  projects = signal<any[]>([]);
  skills = signal<Skill[]>([]);
  careerRoles = signal<CareerRole[]>([]);
  
  // Selected State & Analytics Signals
  selectedRoleId = signal<string>('');
  selectedRole = signal<CareerRole | null>(null);
  skillGap = signal<SkillGapResponse | null>(null);
  portfolioScore = signal<PortfolioScoreResponse | null>(null);
  mlPredictions = signal<{ [projectId: string]: ClassifyProjectResponse }>({});
  
  // Strengths & Weaknesses
  strengthsList = signal<string[]>([]);
  weaknessesList = signal<string[]>([]);

  // Modal Analysis State
  activeAnalysisProject = signal<any | null>(null);

  // Edit Project Modal State
  editingProject = signal<any | null>(null);
  editProjectName = '';
  editProjectDesc = '';
  editProjectStatus: 'idea' | 'active' | 'completed' = 'active';
  isSavingProjectEdit = signal<boolean>(false);

  // Auth Modal State
  showAuthModal = signal<boolean>(false);
  authMode = signal<'login' | 'register' | 'forgot'>('login');
  authError = signal<string>('');

  // Forgot Password 3-Step State
  forgotStep = signal<1 | 2 | 3>(1);
  forgotEmail = '';
  forgotOtp = '';
  forgotNewPassword = '';
  forgotConfirmPassword = '';
  forgotLoading = signal<boolean>(false);
  forgotSuccessMsg = signal<string>('');
  showOtpInput = signal<boolean>(false);
  isRecoveringPassword = signal<boolean>(false);

  // Rate Limiting State
  resendCooldown = signal<number>(0);           // seconds remaining in resend cooldown
  private resendCooldownTimer: any = null;
  otpAttempts = signal<number>(0);              // wrong OTP attempts in current session
  readonly OTP_MAX_ATTEMPTS = 5;
  loginFailCount = signal<number>(0);           // consecutive failed login attempts
  loginLockoutUntil = signal<number>(0);        // timestamp when lockout expires
  readonly LOGIN_LOCKOUT_AFTER = 5;             // lock after 5 failures
  readonly LOGIN_LOCKOUT_SECONDS = 60;          // lockout duration in seconds
  codeExpiry = signal<number>(0);              // seconds until current OTP code expires
  private codeExpiryTimer: any = null;
  readonly CODE_EXPIRY_SECONDS = 3600;          // match Supabase OTP expiry (1 hour default)

  // Form Inputs
  authEmail = '';
  authPassword = '';
  authDisplayName = '';
  showAuthPassword = signal<boolean>(false);
  showForgotNewPassword = signal<boolean>(false);
  showForgotConfirmPassword = signal<boolean>(false);

  // First-Time Quick Onboarding Modal State
  showOnboardingModal = signal<boolean>(false);
  onboardingSelectedRoleId = signal<string>('');
  onboardingSaving = signal<boolean>(false);
  onboardingGitHubUsername = '';

  isDarkMode = signal<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('portfolioiq_theme') !== 'light' : true
  );

  toggleTheme() {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    const theme = next ? 'dark' : 'light';
    if (typeof localStorage !== 'undefined') localStorage.setItem('portfolioiq_theme', theme);
    this.elRef.nativeElement.setAttribute('data-theme', theme);
  }
  
  newProjectName = '';
  newProjectDesc = '';
  newProjectStatus: 'idea' | 'active' | 'completed' = 'idea';
  repoImportStatuses = signal<{ [repoId: string]: 'completed' | 'active' | 'idea' }>({});
  
  // GitHub Import Modal State
  importModalRepo = signal<GitHubRepository | null>(null);
  importModalName = '';
  importModalDesc = '';
  importModalStatus: 'completed' | 'active' | 'idea' = 'completed';
  isImportingModal = signal<boolean>(false);

  // GitHub Batch Import Modal State
  batchImportModalOpen = signal<boolean>(false);
  batchImportStatus: 'completed' | 'active' | 'idea' = 'completed';
  isBatchImporting = signal<boolean>(false);

  // Developer Profile Modal State
  showProfileModal = signal<boolean>(false);
  profileDisplayName = '';
  initialProfileDisplayName = '';
  profileSelectedRoleId = '';
  initialProfileRoleId = '';
  profileCurrentPassword = '';
  profileNewPassword = '';
  profileConfirmPassword = '';
  showCurrentPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  passwordErrorMessage = signal<string>('');
  showProfilePasswordSection = signal<boolean>(false);
  isSavingProfile = signal<boolean>(false);
  isUpdatingProfilePassword = signal<boolean>(false);

  expandedProjectSkills = signal<{ [projectId: string]: boolean }>({});
  expandedProjectDescs = signal<{ [projectId: string]: boolean }>({});
  showAddProjectForm = signal<boolean>(false);
  projectSearchQuery = signal<string>('');
  projectStatusFilter = signal<'all' | 'active' | 'completed' | 'idea'>('all');
  highlightedProjectId = signal<string>('');
  
  newSkillName = '';
  newSkillCategory = 'Programming Language';
  skillsSubView = signal<'my-skills' | 'catalog'>('my-skills');
  skillSearchQuery = signal<string>('');
  skillCategoryFilter = signal<string>('all');

  // Resume Parser Operations
  resumeParsing = signal<boolean>(false);
  resumeData = signal<any>(null);
  syncingResumeSkills = signal<boolean>(false);
  savedResumeMeta = signal<{
    fileName: string;
    uploadedAt: string;
    dataUrl?: string | null;
    extractedSkillsCount?: number;
    extracted_skills?: string[];
    extracted_projects?: any[];
  } | null>(null);
  showResumeModal = signal<boolean>(false);
  resumePdfUrlSafe = signal<SafeResourceUrl | null>(null);
  isSavingResume = signal<boolean>(false);

  // Portfolio Optimization Operations (Stage 11)
  optimizationResult = signal<OptimizationResponse | null>(null);
  isOptimizing = signal<boolean>(false);
  effortBudgetHours = signal<number>(80);
  isGeneratingCustomBlueprint = signal<boolean>(false);
  customAiBlueprint = signal<RecommendedProject | null>(null);
  activeBlueprintView = signal<'curated' | 'ai_custom'>('curated');

  // Knowledge Graph & Representation Operations (Stage 12)
  knowledgeGraphData = signal<KnowledgeGraphData | null>(null);
  selectedKnowledgeRole = signal<string>(
    typeof localStorage !== 'undefined' ? (localStorage.getItem('portfolioiq_selected_knowledge_role') || '') : ''
  );
  roleSkillTree = signal<RoleSkillTreeResponse | null>(null);
  inspectedNodeName = signal<string>('');
  inspectedNodePrereqs = signal<any[]>([]);
  inspectedNodeUnlocked = signal<any[]>([]);
  inspectedNodeComplements = signal<any[]>([]);
  goalSkillInput = signal<string>('Kubernetes');
  goalSkillRoadmap = signal<LearningPathResponse | null>(null);
  isLoadingKnowledge = signal<boolean>(false);
  isEvaluatingLearningPath = signal<boolean>(false);
  knowledgeViewMode = signal<'tree' | 'inspector' | 'path'>('tree');

  // Groq AI Developer Coach Operations (Stage 13)
  coachMessages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your **PortfolioIQ AI Developer Coach** powered by Groq Llama-3.\n\nI have real-time access to your portfolio health score, verified skills, active projects, and Knowledge Graph roadmaps. Ask me anything: how to improve your projects, what skills to prioritize next, or how to break into your target role!",
      timestamp: 'Just now'
    }
  ]);
  coachLoading = signal<boolean>(false);
  coachInput = '';
  coachStatus = signal<CoachStatus | null>(null);
  suggestedFollowups = signal<string[]>([
    'Critique my developer portfolio',
    'Suggest 3 projects for my skill gaps',
    'What should I learn next?'
  ]);
  @ViewChild('chatStream') chatStreamRef?: ElementRef<HTMLDivElement>;
  coachScrollTop: number = -1;

  // GitHub Integration Operations (Stage 14)
  linkedGitHubUsername = signal<string>('');
  verifiedGitHubUsername = signal<string | null>(null);
  isGitHubOAuthVerified = signal<boolean>(false);
  isOAuthConnecting = signal<boolean>(false);
  showOAuthHelpModal = signal<boolean>(false);
  isEditingLinkedGitHub = signal<boolean>(false);
  tempLinkedUsername = '';
  githubUsername = '';
  isScanningGitHub = signal<boolean>(false);
  githubScanData = signal<GitHubScanResponse | null>(null);
  githubStatus = signal<GitHubStatus | null>(null);
  importingRepoId = signal<string | null>(null);
  githubImportSuccessMsg = signal<string>('');
  githubError = signal<string>('');
  githubRepoSearchQuery = signal<string>('');
  githubRepoFilter = signal<'all' | 'not_imported' | 'imported'>('all');
  githubRepoDomainFilter = signal<string>('all');
  expandedSkillMap = signal<{ [skillName: string]: boolean }>({});

  // System Diagnostics & Toast Notifications (Stage 15)
  systemTelemetry = signal<SystemTelemetryResponse | null>(null);
  showTelemetryModal = signal<boolean>(false);
  showScoreInfoModal = signal<boolean>(false);
  isLoadingTelemetry = signal<boolean>(false);
  toasts = signal<ToastItem[]>([]);
  private toastCounter = 0;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private projectService: ProjectService,
    private skillService: SkillService,
    private careerRoleService: CareerRoleService,
    private analyticsService: AnalyticsService,
    private mlService: MlService,
    private optimizationService: OptimizationService,
    private knowledgeService: KnowledgeService,
    private coachService: CoachService,
    private githubService: GitHubService,
    private systemService: SystemService,
    private sanitizer: DomSanitizer,
    private elRef: ElementRef
  ) {
    // Apply theme immediately so auth modal renders with correct theme
    if (typeof localStorage !== 'undefined') {
      const theme = localStorage.getItem('portfolioiq_theme') !== 'light' ? 'dark' : 'light';
      this.elRef.nativeElement.setAttribute('data-theme', theme);
    }
  }

  async ngOnInit() {
    this.checkBackendHealth();

    // Pre-check: If Supabase returned an OAuth state error, clear stale PKCE keys and wipe URL
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      if (search.includes('error_code=bad_oauth_state') || search.includes('error=invalid_request')) {
        // Clear all Supabase PKCE / state keys from localStorage so the next attempt is fresh
        Object.keys(localStorage)
          .filter(k => k.startsWith('sb-') || k.startsWith('supabase'))
          .forEach(k => localStorage.removeItem(k));
        // Also clear sessionStorage stale state
        Object.keys(sessionStorage)
          .filter(k => k.startsWith('sb-') || k.startsWith('supabase'))
          .forEach(k => sessionStorage.removeItem(k));
        // Remove error params from URL without reload
        window.history.replaceState(null, '', window.location.pathname);
        // Show auth modal so the user can retry
        setTimeout(() => {
          this.showAuthModal.set(true);
          this.authMode.set('login');
          this.showToast('GitHub sign-in expired. Please try again.', 'warning');
        }, 500);
      }

      // Pre-check: If loading with password recovery link, mark recovery active immediately
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        this.isRecoveringPassword.set(true);
        this.authMode.set('forgot');
        this.forgotStep.set(3);
        this.forgotSuccessMsg.set('Recovery link verified! Please enter your new password below.');
        this.showAuthModal.set(true);
      }
    }

    // Set up listener BEFORE loading user — so if the page loaded from an OAuth redirect,
    // onAuthStateChange picks up the SIGNED_IN event first and hydrates currentUser.
    this.setupAuthRecoveryListener();
    // Give Supabase detectSessionInUrl a tick to exchange the code/hash before we query
    await new Promise<void>(resolve => setTimeout(resolve, 100));
    await this.loadCurrentUser();
    await this.loadInitialData();
    this.loadInitialKnowledgeData();
    this.loadCoachStatus();
    this.loadCoachMessages();
    this.loadGitHubStatus();
    this.fetchSystemTelemetry();
    this.elRef.nativeElement.setAttribute('data-theme', this.isDarkMode() ? 'dark' : 'light');
  }


  @HostListener('window:resize')
  onWindowResize() {
    if (typeof window !== 'undefined' && window.innerWidth > 1024) {
      if (this.mobileSidebarOpen()) {
        this.mobileSidebarOpen.set(false);
      }
    }
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }

  // Confirmation Dialog Handlers
  openConfirmDialog(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'primary' | 'success';
    icon?: 'logout' | 'delete' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }) {
    this.confirmDialog.set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText !== undefined ? options.cancelText : 'Cancel',
      type: options.type || 'danger',
      icon: options.icon || (options.type === 'primary' ? 'info' : (options.type === 'success' ? 'success' : 'delete')),
      onConfirm: options.onConfirm
    });
  }

  closeConfirmDialog(forceAction = false) {
    const isSingleAction = !this.confirmDialog().cancelText;
    const action = this.confirmDialog().onConfirm;
    this.confirmDialog.update(s => ({ ...s, isOpen: false }));
    if (forceAction && isSingleAction && action) {
      action();
    }
  }

  handleConfirmDialogAction() {
    const action = this.confirmDialog().onConfirm;
    this.closeConfirmDialog(false);
    if (action) {
      action();
    }
  }

  confirmSignOut() {
    this.openConfirmDialog({
      title: 'Sign Out of PortfolioIQ?',
      message: 'Are you sure you want to sign out of your developer account? Any unsaved form changes will be lost.',
      confirmText: 'Sign Out',
      cancelText: 'Stay Signed In',
      type: 'danger',
      icon: 'logout',
      onConfirm: () => this.logout()
    });
  }

  setTab(tabName: string) {
    // If currently on coach tab, save exact scroll position
    if (this.activeTab() === 'coach') {
      const el = this.chatStreamRef?.nativeElement || (document.querySelector('.chat-message-stream') as HTMLDivElement);
      if (el) {
        this.coachScrollTop = el.scrollTop;
      }
    }

    this.activeTab.set(tabName);
    this.closeMobileSidebar();

    if (tabName === 'github') {
      this.loadGitHubStatus();
    }
    if (tabName === 'coach') {
      this.restoreCoachScrollPosition();
    }
  }

  checkBackendHealth() {
    this.apiService.checkBackend().subscribe({
      next: (res) => {
        if (res.status === 'ok') {
          this.backendStatus.set('Backend Online');
          this.backendConnected.set(true);
        }
      },
      error: () => {
        this.backendStatus.set('Backend Offline');
        this.backendConnected.set(false);
      }
    });
  }

  async loadCurrentUser() {
    const user = await this.authService.getUser();
    // During password recovery, Supabase creates a session but we don't want
    // to show the authenticated dashboard yet — only the reset-password modal.
    if (this.isRecoveringPassword()) {
      return;
    }
    this.currentUser.set(user);
    this.checkOAuthGitHubIdentity(user);
    this.loadCloudResume(user);
    if (user) {
      this.checkFirstTimeOnboarding(user);
    }
  }

  checkFirstTimeOnboarding(user: any) {
    if (!user) return;
    const isCompleted = user.user_metadata?.onboarding_completed || 
      (typeof localStorage !== 'undefined' && localStorage.getItem(`portfolioiq_onboarded_${user.id}`) === 'true');
    
    if (!isCompleted) {
      const roles = this.careerRoles();
      if (roles.length > 0 && !this.onboardingSelectedRoleId()) {
        this.onboardingSelectedRoleId.set(this.selectedRoleId() || roles[0].id);
      }
      // Auto-fill GitHub username from OAuth identity — no need to re-enter it
      if (!this.onboardingGitHubUsername) {
        const githubUsername = this.authService.extractGitHubUsername(user);
        if (githubUsername) {
          this.onboardingGitHubUsername = githubUsername;
        }
      }
      this.showOnboardingModal.set(true);
    }
  }

  async completeOnboarding() {
    const user = this.currentUser();
    const roleId = this.onboardingSelectedRoleId() || this.selectedRoleId();
    this.onboardingSaving.set(true);

    try {
      if (roleId) {
        await this.selectCareerRole(roleId);
      }

      if (user) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`portfolioiq_onboarded_${user.id}`, 'true');
        }
        await this.authService.updateUserData({
          onboarding_completed: true,
          target_role_id: roleId
        });
      }

      // Use onboarding GitHub input if provided, else fall back to verified/linked
      const inputUsername = this.onboardingGitHubUsername.trim()
        .replace(/^https?:\/\/github\.com\//i, '')
        .replace(/^@+/, '')
        .trim();
      const targetUsername = inputUsername || this.verifiedGitHubUsername() || this.githubUsername;

      if (inputUsername && user?.id) {
        this.linkedGitHubUsername.set(inputUsername);
        this.githubUsername = inputUsername;
        localStorage.setItem(`portfolioiq_github_${user.id}`, inputUsername);
      }

      if (targetUsername && !this.isScanningGitHub()) {
        this.scanGitHub(targetUsername);
      }

      this.showOnboardingModal.set(false);
      this.showToast('Welcome to PortfolioIQ! Your AI portfolio analysis has started.', 'success');
    } catch (err: any) {
      console.warn('Error saving onboarding data:', err);
      this.showOnboardingModal.set(false);
    } finally {
      this.onboardingSaving.set(false);
    }
  }

  getOnboardingName(): string {
    const user = this.currentUser();
    if (!user) return 'Developer';
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.user_metadata?.user_name || 
           (user.email ? user.email.split('@')[0] : 'Developer');
  }

  getOnboardingAvatar(): string {
    const user = this.currentUser();
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    const gh = this.verifiedGitHubUsername() || this.githubUsername;
    if (gh) {
      return `https://github.com/${gh}.png`;
    }
    return '';
  }

  loadCloudResume(user: any) {
    if (!user || !user.user_metadata || !user.user_metadata.portfolio_resume) {
      this.savedResumeMeta.set(null);
      this.resumePdfUrlSafe.set(null);
      return;
    }

    const resumeMeta = user.user_metadata.portfolio_resume;
    this.savedResumeMeta.set(resumeMeta);
    if (resumeMeta.dataUrl) {
      this.resumePdfUrlSafe.set(this.formatPdfViewerUrl(resumeMeta.dataUrl));
    }
  }

  formatPdfViewerUrl(url: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    const targetUrl = url.includes('#') ? url : `${url}#toolbar=1&navpanes=0&view=FitH`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(targetUrl);
  }

  checkOAuthGitHubIdentity(user: any) {
    if (!user) {
      this.verifiedGitHubUsername.set(null);
      this.isGitHubOAuthVerified.set(false);
      this.linkedGitHubUsername.set('');
      this.githubUsername = '';
      this.githubScanData.set(null);
      return;
    }

    // 1. Check if user has an OAuth verified GitHub identity
    const verified = this.authService.extractGitHubUsername(user);
    if (verified) {
      this.verifiedGitHubUsername.set(verified);
      this.isGitHubOAuthVerified.set(true);
      this.linkedGitHubUsername.set(verified);
      this.githubUsername = verified;
      localStorage.setItem(`portfolioiq_github_${user.id}`, verified);
      if (!this.githubScanData() && !this.isScanningGitHub()) {
        this.scanGitHub(verified);
      }
      return;
    }

    // 2. Load linked GitHub username specifically tied to THIS user ID or default to ch1llysauce
    const userSavedGithub = localStorage.getItem(`portfolioiq_github_${user.id}`) || 'ch1llysauce';
    this.linkedGitHubUsername.set(userSavedGithub);
    this.githubUsername = userSavedGithub;
    this.verifiedGitHubUsername.set(userSavedGithub);
    this.isGitHubOAuthVerified.set(true);
    if (!this.githubScanData() && !this.isScanningGitHub()) {
      this.scanGitHub(userSavedGithub);
    }
  }

  async loadInitialData() {
    await this.fetchSkills();
    await this.fetchCareerRoles();
    if (this.currentUser()) {
      await this.fetchProjects();
    }
  }

  // Auth Modal Controls
  openAuthModal(mode: 'login' | 'register' | 'forgot' = 'login') {
    this.authMode.set(mode);
    this.authError.set('');
    this.forgotSuccessMsg.set('');
    if (mode === 'forgot') {
      this.resetForgotFlow();
    }
    this.showAuthModal.set(true);
  }

  closeAuthModal() {
    this.showAuthModal.set(false);
    this.authError.set('');
    this.forgotSuccessMsg.set('');
    this.showAuthPassword.set(false);
    this.showForgotNewPassword.set(false);
    this.showForgotConfirmPassword.set(false);
    this.isRecoveringPassword.set(false);
    this.stopResendCooldown();
    this.stopCodeExpiry();
  }

  switchAuthMode(mode: 'login' | 'register' | 'forgot') {
    this.authMode.set(mode);
    this.authError.set('');
    this.forgotSuccessMsg.set('');
    this.showAuthPassword.set(false);
    if (mode === 'forgot') {
      this.resetForgotFlow();
    }
  }

  resetForgotFlow() {
    this.forgotStep.set(1);
    this.forgotEmail = this.authEmail || '';
    this.forgotOtp = '';
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotLoading.set(false);
    this.forgotSuccessMsg.set('');
    this.authError.set('');
    this.showOtpInput.set(false);
    this.isRecoveringPassword.set(false);
    // Reset OTP rate limiting state
    this.otpAttempts.set(0);
    this.stopResendCooldown();
    this.stopCodeExpiry();
  }

  // --- Rate Limiting Helpers ---

  startResendCooldown(seconds = 60) {
    this.stopResendCooldown();
    this.resendCooldown.set(seconds);
    this.stopResendCooldown();
    this.resendCooldownTimer = setInterval(() => {
      const remaining = this.resendCooldown() - 1;
      if (remaining <= 0) {
        this.stopResendCooldown();
      } else {
        this.resendCooldown.set(remaining);
      }
    }, 1000);
  }

  stopResendCooldown() {
    if (this.resendCooldownTimer) {
      clearInterval(this.resendCooldownTimer);
      this.resendCooldownTimer = null;
    }
    this.resendCooldown.set(0);
  }

  loginLockoutRemaining(): number {
    const until = this.loginLockoutUntil();
    if (!until) return 0;
    const remaining = Math.ceil((until - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  isLoginLocked(): boolean {
    return this.loginLockoutRemaining() > 0;
  }

  startCodeExpiry(seconds = this.CODE_EXPIRY_SECONDS) {
    this.stopCodeExpiry();
    this.codeExpiry.set(seconds);
    this.codeExpiryTimer = setInterval(() => {
      const remaining = this.codeExpiry() - 1;
      if (remaining <= 0) {
        this.stopCodeExpiry();
      } else {
        this.codeExpiry.set(remaining);
      }
    }, 1000);
  }

  stopCodeExpiry() {
    if (this.codeExpiryTimer) {
      clearInterval(this.codeExpiryTimer);
      this.codeExpiryTimer = null;
    }
    this.codeExpiry.set(0);
  }

  formatExpiry(seconds: number): string {
    if (seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  toggleOtpInput(show: boolean) {
    this.showOtpInput.set(show);
  }

  setForgotStep(step: 1 | 2 | 3) {
    this.forgotStep.set(step);
    this.authError.set('');
    this.showOtpInput.set(false);
  }

  onOtpInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      const sanitized = target.value.replace(/\D/g, '').slice(0, 8);
      this.forgotOtp = sanitized;
      target.value = sanitized;
    }
  }

  // 3-Step Forgot Password Flow
  async sendForgotOtp() {
    const email = this.forgotEmail.trim();
    if (!email) {
      this.authError.set('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.authError.set('Please enter a valid email address.');
      return;
    }

    this.authError.set('');
    this.forgotLoading.set(true);
    try {
      const { error } = await this.authService.resetPasswordForEmail(email);
      if (error) {
        this.authError.set(error.message);
      } else {
        this.forgotSuccessMsg.set(`Password reset email sent to ${email}. Check your inbox!`);
        this.forgotStep.set(2);
        this.startResendCooldown(60);
        this.startCodeExpiry();
      }
    } catch (err: any) {
      this.authError.set(err.message || 'Failed to send recovery code.');
    } finally {
      this.forgotLoading.set(false);
    }
  }

  async verifyForgotOtp() {
    const email = this.forgotEmail.trim();
    const token = this.forgotOtp.trim();

    // Block if max attempts reached
    if (this.otpAttempts() >= this.OTP_MAX_ATTEMPTS) {
      this.authError.set('Too many incorrect attempts. Please request a new code.');
      return;
    }

    if (!token || token.length < 4) {
      this.authError.set('Please enter the verification code from your email.');
      return;
    }

    this.authError.set('');
    this.forgotLoading.set(true);
    try {
      const { error } = await this.authService.verifyRecoveryOtp(email, token);
      if (error) {
        const attempts = this.otpAttempts() + 1;
        this.otpAttempts.set(attempts);
        const remaining = this.OTP_MAX_ATTEMPTS - attempts;
        if (remaining <= 0) {
          this.authError.set('Too many incorrect attempts. Please request a new code.');
        } else {
          this.authError.set(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        }
      } else {
        // Mark as recovering so the dashboard stays hidden during Step 3
        this.isRecoveringPassword.set(true);
        this.otpAttempts.set(0);
        this.stopCodeExpiry();
        this.stopResendCooldown();
        this.forgotSuccessMsg.set('Code verified successfully! Now set your new password.');
        this.forgotStep.set(3);
      }
    } catch (err: any) {
      this.authError.set(err.message || 'Verification failed.');
    } finally {
      this.forgotLoading.set(false);
    }
  }

  async resendForgotOtp() {
    if (this.forgotLoading() || this.resendCooldown() > 0) return;
    const email = this.forgotEmail.trim();
    if (!email) return;

    this.authError.set('');
    this.forgotLoading.set(true);
    try {
      const { error } = await this.authService.resetPasswordForEmail(email);
      if (error) {
        this.authError.set(error.message);
      } else {
        // Reset OTP attempts and start 60s cooldown
        this.otpAttempts.set(0);
        this.forgotOtp = '';
        this.forgotSuccessMsg.set('A new code has been sent to your email.');
        this.startResendCooldown(60);
        this.startCodeExpiry();
      }
    } catch (err: any) {
      this.authError.set(err.message || 'Failed to resend code.');
    } finally {
      this.forgotLoading.set(false);
    }
  }

  async submitNewPassword() {
    if (!this.forgotNewPassword || this.forgotNewPassword.length < 6) {
      this.authError.set('Password must be at least 6 characters long.');
      return;
    }
    if (this.forgotNewPassword !== this.forgotConfirmPassword) {
      this.authError.set('Passwords do not match. Please re-enter.');
      return;
    }

    this.authError.set('');
    this.forgotLoading.set(true);
    try {
      const { error } = await this.authService.updateUserPassword(this.forgotNewPassword);
      if (error) {
        this.authError.set(error.message);
      } else {
        this.isRecoveringPassword.set(false);
        this.forgotSuccessMsg.set('Password updated successfully! Logging you in...');
        if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        await this.loadCurrentUser();
        if (this.currentUser()) {
          await this.fetchProjects();
        }
        setTimeout(() => {
          this.closeAuthModal();
          this.showToast('Password updated successfully! Welcome back.', 'success');
        }, 1200);
      }
    } catch (err: any) {
      this.authError.set(err.message || 'Failed to update password.');
    } finally {
      this.forgotLoading.set(false);
    }
  }

  setupAuthRecoveryListener() {
    const isUrlRecovery = typeof window !== 'undefined' && 
      ((window.location.hash || '').includes('type=recovery') || (window.location.search || '').includes('type=recovery'));
    if (isUrlRecovery) {
      this.isRecoveringPassword.set(true);
    }

    // 1. Listen for Supabase auth state change events
    this.authService.onAuthStateChange(async (event, session) => {
      // Check if this event is part of password recovery flow
      const inRecovery = event === 'PASSWORD_RECOVERY' || this.isRecoveringPassword() ||
        (typeof window !== 'undefined' && ((window.location.hash || '').includes('type=recovery') || (window.location.search || '').includes('type=recovery')));

      if (inRecovery) {
        this.isRecoveringPassword.set(true);
        const user = session?.user ?? null;
        if (user) {
          // Only store email for the forgot-password form — do NOT set currentUser
          // so the authenticated dashboard stays hidden behind the modal.
          this.authEmail = user.email || '';
          this.forgotEmail = user.email || '';
        }
        this.authMode.set('forgot');
        this.forgotStep.set(3);
        this.forgotSuccessMsg.set('Recovery link verified! Please enter your new password below.');
        this.authError.set('');
        this.showAuthModal.set(true);
        return; // NEVER close auth modal or show sign-in toast during recovery!
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        const user = session?.user ?? null;
        if (user) {
          const previousUserId = this.currentUser()?.id;
          const isNewSignIn = !previousUserId || previousUserId !== user.id;

          this.currentUser.set(user);
          this.isOAuthConnecting.set(false);
          this.closeAuthModal();
          this.checkOAuthGitHubIdentity(user);
          this.loadCloudResume(user);
          await this.fetchProjects();
          this.checkFirstTimeOnboarding(user);

          // Only show toast on genuine sign-in event for newly signed in user
          if (event === 'SIGNED_IN' && isNewSignIn) {
            this.showToast(`Signed in successfully as ${user.email || user.user_metadata?.user_name || 'user'}!`, 'success');
          }

          // Clean OAuth hash or PKCE code from browser URL bar cleanly without reload
          if (typeof window !== 'undefined') {
            const hash = window.location.hash || '';
            const search = window.location.search || '';
            if (hash.includes('access_token=') || hash.includes('refresh_token=') || search.includes('code=')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Guard against false/spurious SIGNED_OUT events during token refresh
        const activeSession = await this.authService.getSession();
        if (activeSession?.user) {
          return;
        }

        this.currentUser.set(null);
        this.verifiedGitHubUsername.set(null);
        this.isGitHubOAuthVerified.set(false);
        this.projects.set([]);
        this.portfolioScore.set(null);
        this.skillGap.set(null);
        this.strengthsList.set([]);
        this.weaknessesList.set([]);
        this.resumeData.set(null);
        this.savedResumeMeta.set(null);
        this.resumePdfUrlSafe.set(null);
        this.showResumeModal.set(false);
        this.closeAuthModal();

        // Strip any residual OAuth URL tokens
        if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    // 2. Direct check on initial URL for OAuth redirect tokens or recovery
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const isRecovery = hash.includes('type=recovery') || search.includes('type=recovery');

      if (isRecovery) {
        this.isRecoveringPassword.set(true);
        setTimeout(async () => {
          const session = await this.authService.getSession();
          const user = session?.user || await this.authService.getUser();
          if (user) {
            // Only store email — do NOT set currentUser during recovery
            this.authEmail = user.email || '';
            this.forgotEmail = user.email || '';
          }
          this.authMode.set('forgot');
          this.forgotStep.set(3);
          this.forgotSuccessMsg.set('Recovery link verified! Please enter your new password below.');
          this.authError.set('');
          this.showAuthModal.set(true);
        }, 150);
        return; // CRITICAL: Stop here so GitHub OAuth block does not run!
      }

      const hasOAuthCode = search.includes('code=');
      const hasImplicitToken = hash.includes('access_token=') || hash.includes('refresh_token=');

      if (hasOAuthCode || hasImplicitToken) {
        // Returned from GitHub OAuth redirect — wait for Supabase to exchange code/hash
        setTimeout(async () => {
          // If PKCE code is in URL, explicitly exchange it for a session
          if (hasOAuthCode) {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            if (code) {
              try {
                await this.authService.exchangeCodeForSession(code);
              } catch (e) {
                console.warn('exchangeCodeForSession failed (may already be handled):', e);
              }
            }
          }

          await this.loadCurrentUser();
          if (this.currentUser()) {
            this.closeAuthModal();
            this.isOAuthConnecting.set(false);
            await this.fetchProjects();
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 400);
      }
    }
  }

  // GitHub OAuth Operations
  async signInWithGitHub() {
    this.authError.set('');
    this.isOAuthConnecting.set(true);
    try {
      const { error } = await this.authService.signInWithGitHub();
      if (error) {
        if (error.message.toLowerCase().includes('not enabled') || error.message.toLowerCase().includes('unsupported provider')) {
          this.authError.set('GitHub OAuth is not yet enabled in your Supabase project. Click "Setup Guide" below for 2-minute instructions.');
          this.showOAuthHelpModal.set(true);
        } else {
          this.authError.set(error.message);
        }
      }
    } catch (err: any) {
      this.authError.set(err.message || 'GitHub OAuth sign-in failed.');
    } finally {
      this.isOAuthConnecting.set(false);
    }
  }

  async connectGitHubOAuth() {
    this.githubError.set('');
    this.isOAuthConnecting.set(true);
    try {
      if (this.currentUser()) {
        const { error } = await this.authService.linkWithGitHub();
        if (error) {
          if (error.message.toLowerCase().includes('not enabled') || error.message.toLowerCase().includes('unsupported provider')) {
            this.githubError.set('GitHub OAuth provider is not yet enabled in your Supabase Dashboard.');
            this.showOAuthHelpModal.set(true);
          } else {
            this.githubError.set(error.message);
          }
        }
      } else {
        await this.signInWithGitHub();
      }
    } catch (err: any) {
      this.githubError.set(err.message || 'Failed to connect GitHub account.');
    } finally {
      this.isOAuthConnecting.set(false);
    }
  }

  openOAuthHelpModal() {
    this.showOAuthHelpModal.set(true);
  }

  closeOAuthHelpModal() {
    this.showOAuthHelpModal.set(false);
  }

  // Auth Operations
  async register() {
    if (!this.authEmail || !this.authPassword) {
      this.authError.set('Please provide both email and password.');
      return;
    }
    this.authError.set('');
    const { data, error } = await this.authService.signUp(
      this.authEmail,
      this.authPassword,
      this.authDisplayName || 'Developer'
    );
    if (error) {
      this.authError.set(error.message);
    } else {
      this.closeAuthModal();
      this.showToast('Registration Successful! You can now log in.', 'success');
      await this.loadCurrentUser();
    }
  }

  async login() {
    if (!this.authEmail || !this.authPassword) {
      this.authError.set('Please provide both email and password.');
      return;
    }

    // Check if currently locked out
    if (this.isLoginLocked()) {
      const secs = this.loginLockoutRemaining();
      this.authError.set(`Too many failed attempts. Please wait ${secs} second${secs === 1 ? '' : 's'} before trying again.`);
      return;
    }

    this.authError.set('');
    const { data, error } = await this.authService.signIn(this.authEmail, this.authPassword);
    if (error) {
      const fails = this.loginFailCount() + 1;
      this.loginFailCount.set(fails);
      if (fails >= this.LOGIN_LOCKOUT_AFTER) {
        this.loginLockoutUntil.set(Date.now() + this.LOGIN_LOCKOUT_SECONDS * 1000);
        this.loginFailCount.set(0);
        // Keep lockout message refreshed — but only while still on login screen
        const tick = setInterval(() => {
          if (!this.isLoginLocked()) {
            clearInterval(tick);
            if (this.authMode() === 'login') this.authError.set('');
          } else if (this.authMode() === 'login') {
            const secs = this.loginLockoutRemaining();
            this.authError.set(`Too many failed attempts. Please wait ${secs} second${secs === 1 ? '' : 's'} before trying again.`);
          }
        }, 1000);
        this.authError.set(`Too many failed attempts. Please wait ${this.LOGIN_LOCKOUT_SECONDS} seconds before trying again.`);
      } else {
        const remaining = this.LOGIN_LOCKOUT_AFTER - fails;
        this.authError.set(`${error.message} (${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout)`);
      }
    } else {
      this.loginFailCount.set(0);
      this.loginLockoutUntil.set(0);
      this.closeAuthModal();
      this.showToast('Welcome back! Signed in successfully.', 'success');
      await this.loadCurrentUser();
      await this.fetchProjects();
    }
  }


  async logout(silent = false) {
    // 1. Clean URL parameters first so background listener does not re-authenticate
    if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    await this.authService.signOut();
    this.currentUser.set(null);
    this.linkedGitHubUsername.set('');
    this.verifiedGitHubUsername.set(null);
    this.isGitHubOAuthVerified.set(false);
    this.devBypassActive.set(false);
    this.githubUsername = '';
    this.githubScanData.set(null);
    this.projects.set([]);
    this.portfolioScore.set(null);
    this.skillGap.set(null);
    this.strengthsList.set([]);
    this.weaknessesList.set([]);
    this.optimizationResult.set(null);
    this.customAiBlueprint.set(null);
    this.resumeData.set(null);
    this.savedResumeMeta.set(null);
    this.resumePdfUrlSafe.set(null);
    this.showResumeModal.set(false);

    // Clear all portfolioiq keys from localStorage except theme preference
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage)
        .filter(k => k.startsWith('portfolioiq_') && k !== 'portfolioiq_theme')
        .forEach(k => localStorage.removeItem(k));
    }

    this.closeAuthModal();
    this.closeProfileModal();
    if (!silent) {
      this.showToast('You have been signed out.', 'info');
    }
  }

  getUserDisplayName(): string {
    const u = this.currentUser();
    if (!u) return 'Developer';
    return u.user_metadata?.display_name 
      || u.user_metadata?.full_name 
      || u.user_metadata?.name 
      || (u.email ? u.email.split('@')[0] : 'Developer');
  }

  getUserInitial(): string {
    const name = this.getUserDisplayName();
    return name.charAt(0).toUpperCase();
  }

  getUserAvatar(): string {
    const user = this.currentUser();
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    const gh = this.verifiedGitHubUsername() || this.githubUsername;
    if (gh) {
      return `https://github.com/${gh}.png?size=64`;
    }
    return '';
  }

  openProfileModal() {
    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }
    this.profileDisplayName = this.getUserDisplayName();
    this.initialProfileDisplayName = this.profileDisplayName;
    this.profileSelectedRoleId = this.selectedRole()?.id || '';
    this.initialProfileRoleId = this.profileSelectedRoleId;
    this.profileCurrentPassword = '';
    this.profileNewPassword = '';
    this.profileConfirmPassword = '';
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
    this.passwordErrorMessage.set('');
    this.showProfilePasswordSection.set(false);
    this.showProfileModal.set(true);
  }

  hasUnsavedProfileChanges(): boolean {
    if (!this.showProfileModal()) return false;
    const nameChanged = this.profileDisplayName.trim() !== this.initialProfileDisplayName.trim();
    const roleChanged = (this.profileSelectedRoleId || '') !== (this.initialProfileRoleId || '');
    const passwordEntered = !!(this.profileCurrentPassword.trim() || this.profileNewPassword || this.profileConfirmPassword);
    return nameChanged || roleChanged || passwordEntered;
  }

  handleCloseProfileModal() {
    if (this.hasUnsavedProfileChanges()) {
      this.openConfirmDialog({
        title: 'Discard Unsaved Changes?',
        message: 'You have modified your profile details. If you leave now, your changes will not be saved.',
        confirmText: 'Discard Changes',
        cancelText: 'Keep Editing',
        type: 'warning',
        icon: 'warning',
        onConfirm: () => {
          this.closeProfileModal();
        }
      });
    } else {
      this.closeProfileModal();
    }
  }

  closeProfileModal() {
    this.showProfileModal.set(false);
    this.profileCurrentPassword = '';
    this.profileNewPassword = '';
    this.profileConfirmPassword = '';
    this.passwordErrorMessage.set('');
    this.showProfilePasswordSection.set(false);
    this.isSavingProfile.set(false);
    this.isUpdatingProfilePassword.set(false);
  }

  async saveProfileChanges() {
    const user = this.currentUser();
    if (!user) return;

    const trimmedName = this.profileDisplayName.trim();
    if (!trimmedName) {
      this.showToast('Display name cannot be empty.', 'warning');
      return;
    }
    if (trimmedName.length < 2) {
      this.showToast('Display name must be at least 2 characters.', 'warning');
      return;
    }
    if (trimmedName.length > 32) {
      this.showToast('Display name cannot exceed 32 characters.', 'warning');
      return;
    }

    const hasPasswordInput = !!(this.profileCurrentPassword || this.profileNewPassword || this.profileConfirmPassword);

    // If password fields are populated, validate them first before saving anything
    if (hasPasswordInput) {
      if (!this.profileCurrentPassword) {
        this.showProfilePasswordSection.set(true);
        this.passwordErrorMessage.set('Please enter your current password.');
        return;
      }
      if (!this.profileNewPassword || this.profileNewPassword.length < 6) {
        this.showProfilePasswordSection.set(true);
        this.passwordErrorMessage.set('New password must be at least 6 characters.');
        return;
      }
      if (this.profileNewPassword === this.profileCurrentPassword) {
        this.showProfilePasswordSection.set(true);
        this.passwordErrorMessage.set('New password cannot be the same as your current password.');
        return;
      }
      if (this.profileNewPassword !== this.profileConfirmPassword) {
        this.showProfilePasswordSection.set(true);
        this.passwordErrorMessage.set('Confirm password does not match new password.');
        return;
      }
    }

    this.isSavingProfile.set(true);
    try {
      const { data, error } = await this.authService.updateUserProfile(trimmedName);
      if (error) throw error;

      if (data && data.user) {
        this.currentUser.set(data.user);
      }

      // If career role was changed in profile modal, update it
      if (this.profileSelectedRoleId && this.profileSelectedRoleId !== this.selectedRole()?.id) {
        await this.selectCareerRole(this.profileSelectedRoleId);
      }

      // If password was also provided, execute password update now
      if (hasPasswordInput) {
        const passSuccess = await this.updateAccountPassword();
        if (!passSuccess) {
          // Password update failed (e.g. current pass was wrong)
          return;
        }
        // If successful, updateAccountPassword already logged out and opened the confirm dialog
        return;
      }

      this.showToast('Profile updated successfully!', 'success');
      this.closeProfileModal();
    } catch (err: any) {
      console.error('Update profile error:', err);
      this.showToast('Failed to update profile: ' + (err.message || ''), 'error');
    } finally {
      this.isSavingProfile.set(false);
    }
  }

  async updateAccountPassword(): Promise<boolean> {
    const user = this.currentUser();
    if (!user || !user.email) {
      this.passwordErrorMessage.set('You must be signed in to update your password.');
      return false;
    }

    this.passwordErrorMessage.set('');

    const currentPass = this.profileCurrentPassword;
    const newPass = this.profileNewPassword;
    const confirmPass = this.profileConfirmPassword;

    if (!currentPass) {
      this.showProfilePasswordSection.set(true);
      this.passwordErrorMessage.set('Please enter your current password.');
      return false;
    }

    if (!newPass || newPass.length < 6) {
      this.showProfilePasswordSection.set(true);
      this.passwordErrorMessage.set('New password must be at least 6 characters.');
      return false;
    }

    if (newPass === currentPass) {
      this.showProfilePasswordSection.set(true);
      this.passwordErrorMessage.set('New password cannot be the same as your current password.');
      return false;
    }

    if (newPass !== confirmPass) {
      this.showProfilePasswordSection.set(true);
      this.passwordErrorMessage.set('Confirm password does not match new password.');
      return false;
    }

    this.isUpdatingProfilePassword.set(true);
    try {
      const userEmail = (user.email || '').trim();

      // Ensure pending profile updates (display name) are saved if valid
      const trimmedName = this.profileDisplayName.trim();
      if (trimmedName && trimmedName !== (user.user_metadata?.display_name || user.user_metadata?.full_name)) {
        try {
          await this.authService.updateUserProfile(trimmedName);
        } catch (nameErr) {
          console.warn('Could not save display name prior to password change:', nameErr);
        }
      }

      // 1. Verify current password by verifying credentials with Supabase
      const { data: signInData, error: signInErr } = await this.authService.signIn(userEmail, currentPass);
      if (signInErr) {
        console.warn('Password verification failed:', signInErr.message);
        this.showProfilePasswordSection.set(true);
        this.passwordErrorMessage.set('Current password is incorrect. Please verify and try again.');
        return false;
      }

      // 2. If verified, update to new password in Supabase
      const { data: updateData, error: updateErr } = await this.authService.updatePassword(newPass);
      if (updateErr) {
        console.error('Supabase update password error:', updateErr);
        throw updateErr;
      }

      // Clear password form fields
      this.profileCurrentPassword = '';
      this.profileNewPassword = '';
      this.profileConfirmPassword = '';
      this.passwordErrorMessage.set('');
      this.showProfilePasswordSection.set(false);
      this.closeProfileModal();

      // Sign out IMMEDIATELY to terminate the session as requested by Option A
      await this.logout(true);

      // Show Success Confirmation Prompt
      this.openConfirmDialog({
        title: 'Password Updated Successfully',
        message: 'Your account password has been updated. You have been signed out for security. Please sign in with your new password to continue.',
        confirmText: 'Sign In Now',
        cancelText: '', // single action
        type: 'success',
        icon: 'success',
        onConfirm: () => {
          this.authEmail = userEmail;
          this.authPassword = '';
          this.authMode.set('login');
          this.authError.set('');
          this.forgotSuccessMsg.set('Password changed successfully! Please enter your new password.');
          this.showAuthModal.set(true);
        }
      });
      return true;
    } catch (err: any) {
      console.error('Update password error:', err);
      const msg = err.message || 'Failed to update password.';
      this.showProfilePasswordSection.set(true);
      this.passwordErrorMessage.set(msg);
      return false;
    } finally {
      this.isUpdatingProfilePassword.set(false);
    }
  }

  // Skills Operations
  getCanonicalSkillName(rawName: string): string {
    if (!rawName) return '';
    const trimmed = rawName.trim();
    const lower = trimmed.toLowerCase();

    const aliasMap: { [key: string]: string } = {
      // Programming Languages
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'es6': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'advanced typescript patterns': 'TypeScript',
      'advanced typescript': 'TypeScript',
      'typescript patterns': 'TypeScript',
      'py': 'Python',
      'python': 'Python',
      'python3': 'Python',
      'cpp': 'C++',
      'c++': 'C++',
      'cplusplus': 'C++',
      'csharp': 'C#',
      'c#': 'C#',
      'golang': 'Go',
      'go': 'Go',
      'dart': 'Dart',
      'java': 'Java',
      'php': 'PHP',
      'ruby': 'Ruby',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'r': 'R',
      'scala': 'Scala',
      'solidity': 'Solidity',
      'sql': 'SQL',

      // Frontend
      'html': 'HTML/CSS',
      'css': 'HTML/CSS',
      'html5': 'HTML/CSS',
      'css3': 'HTML/CSS',
      'html/css': 'HTML/CSS',
      'tailwind': 'Tailwind CSS',
      'tailwindcss': 'Tailwind CSS',
      'tailwind css': 'Tailwind CSS',
      'bootstrap': 'Bootstrap',
      'sass': 'Sass',
      'scss': 'Sass',
      'jquery': 'jQuery',
      'responsive web design': 'Responsive Web Design',
      'pwa': 'PWA',
      'progressive web app': 'PWA',
      'progressive web apps': 'PWA',

      // Frameworks
      'react': 'React',
      'reactjs': 'React',
      'react.js': 'React',
      'react native': 'React Native',
      'angular': 'Angular',
      'angularjs': 'Angular',
      'angular.js': 'Angular',
      'vue': 'Vue.js',
      'vuejs': 'Vue.js',
      'vue.js': 'Vue.js',
      'next': 'Next.js',
      'nextjs': 'Next.js',
      'next.js': 'Next.js',
      'nuxt': 'Nuxt.js',
      'nuxtjs': 'Nuxt.js',
      'nuxt.js': 'Nuxt.js',
      'svelte': 'Svelte',
      'fastapi': 'FastAPI',
      'fast api': 'FastAPI',
      'express': 'Express.js',
      'expressjs': 'Express.js',
      'express.js': 'Express.js',
      'django': 'Django',
      'flask': 'Flask',
      'spring': 'Spring Boot',
      'spring boot': 'Spring Boot',
      'springboot': 'Spring Boot',
      'laravel': 'Laravel',
      'nestjs': 'NestJS',
      'nest': 'NestJS',
      'node': 'Node.js',
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
      'flutter': 'Flutter',
      'asp.net': 'ASP.NET Core',
      'asp.net core': 'ASP.NET Core',
      '.net': 'ASP.NET Core',
      '.net core': 'ASP.NET Core',
      'dotnet': 'ASP.NET Core',
      'ruby on rails': 'Ruby on Rails',
      'rails': 'Ruby on Rails',

      // Databases
      'sqlite': 'SQLite',
      'sqlite3': 'SQLite',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mysql': 'MySQL',
      'mongodb': 'MongoDB',
      'mongo': 'MongoDB',
      'supabase': 'Supabase',
      'firebase': 'Firebase',
      'firestore': 'Firestore',
      'firebase firestore': 'Firebase Firestore',
      'redis': 'Redis',
      'oracle': 'Oracle',
      'mariadb': 'MariaDB',
      'cassandra': 'Cassandra',
      'dynamodb': 'DynamoDB',
      'chromadb': 'ChromaDB',
      'pinecone': 'Pinecone',
      'prisma': 'Prisma',
      'typeorm': 'TypeORM',
      'mongoose': 'Mongoose',
      'relational database': 'Relational Database Design',
      'relational database design': 'Relational Database Design',
      'vector databases': 'Vector Databases',

      // Tools & DevOps
      'git': 'Git',
      'github': 'GitHub',
      'gh': 'GitHub',
      'gitlab': 'GitLab',
      'docker': 'Docker',
      'docker compose': 'Docker',
      'kubernetes': 'Kubernetes',
      'k8s': 'Kubernetes',
      'ci/cd': 'CI/CD',
      'cicd': 'CI/CD',
      'ci/cd pipeline automation': 'CI/CD',
      'ci/cd pipeline': 'CI/CD',
      'pipeline automation': 'CI/CD',
      'github actions': 'GitHub Actions',
      'aws': 'AWS (Amazon Web Services)',
      'azure': 'Microsoft Azure',
      'gcp': 'Google Cloud Platform (GCP)',
      'google cloud': 'Google Cloud Platform (GCP)',
      'linux': 'Linux',
      'ubuntu': 'Linux',
      'nginx': 'Nginx',
      'apache': 'Apache',
      'terraform': 'Terraform',
      'ansible': 'Ansible',
      'jenkins': 'Jenkins',
      'postman': 'Postman',
      'vercel': 'Vercel',
      'netlify': 'Netlify',
      'heroku': 'Heroku',
      'vite': 'Vite',
      'expo': 'Expo',
      'vs code': 'VS Code',
      'vscode': 'VS Code',
      'visual studio code': 'VS Code',
      'devops': 'DevOps',
      'production monitoring & observability': 'Observability & Monitoring',
      'monitoring & observability': 'Observability & Monitoring',
      'observability': 'Observability & Monitoring',
      'security best practices (owasp)': 'Cybersecurity',
      'security best practices': 'Cybersecurity',

      // Backend & Architecture
      'rest': 'REST API',
      'restful': 'REST API',
      'rest api': 'REST API',
      'restful api': 'REST API',
      'restful apis': 'REST API',
      'rest apis': 'REST API',
      'restful api design': 'REST API',
      'rest api design': 'REST API',
      'api design': 'REST API',
      'graphql': 'GraphQL',
      'microservices': 'Microservices',
      'microservice': 'Microservices',
      'websockets': 'WebSockets',
      'grpc': 'gRPC',
      'backend development': 'Backend Development',

      // Computer Science
      'data structures': 'Data Structures & Algorithms',
      'algorithms': 'Data Structures & Algorithms',
      'dsa': 'Data Structures & Algorithms',
      'data structures & algorithms': 'Data Structures & Algorithms',
      'software engineering': 'Software Engineering',
      'system design': 'System Design',
      'system design & scalability': 'System Design',
      'scalability': 'System Design',
      'system architecture': 'System Design',

      // AI & Data Science
      'machine learning': 'Machine Learning',
      'ml': 'Machine Learning',
      'deep learning': 'Deep Learning',
      'artificial intelligence': 'Artificial Intelligence',
      'ai': 'Artificial Intelligence',
      'nlp': 'NLP',
      'computer vision': 'Computer Vision',
      'computer vision integration': 'Computer Vision',
      'pytorch': 'PyTorch',
      'tensorflow': 'TensorFlow',
      'keras': 'Keras',
      'scikit-learn': 'Scikit-Learn',
      'pandas': 'Pandas',
      'numpy': 'NumPy',
      'matplotlib': 'Matplotlib',
      'seaborn': 'Seaborn',
      'data science': 'Data Science',
      'data engineering': 'Data Engineering',
      'rag': 'Retrieval-Augmented Generation (RAG)',
      'retrieval-augmented generation': 'Retrieval-Augmented Generation (RAG)',
      'retrieval-augmented generation (rag)': 'Retrieval-Augmented Generation (RAG)',
      'llm': 'LLMs / Generative AI',
      'llms': 'LLMs / Generative AI',
      'genai': 'LLMs / Generative AI',
      'generative ai': 'LLMs / Generative AI',
      'mlops': 'MLOps',
      'langchain': 'LangChain',
      'huggingface': 'Hugging Face Transformers',
      'openai': 'OpenAI API',
      'spark': 'Apache Spark',
      'pyspark': 'Apache Spark',
      'kafka': 'Apache Kafka',
      'etl': 'ETL Pipelines',
      'etl pipelines': 'ETL Pipelines',
      'data visualization': 'Data Visualization',

      // Professional Skills
      'adaptability': 'Adaptability',
      'problem solving': 'Problem Solving',
      'code reviews': 'Code Reviews',
      'technical documentation': 'Technical Documentation',
      'communication': 'Communication',
      'teamwork': 'Teamwork',
      'team collaboration': 'Team Collaboration',
      'collaboration': 'Collaboration',
      'leadership': 'Leadership',
      'critical thinking': 'Critical Thinking',
      'time management': 'Time Management',

      // Product Management
      'product management': 'Product Management',
      'agile': 'Agile / Scrum',
      'scrum': 'Agile / Scrum',
      'agile / scrum': 'Agile / Scrum',
      'agile / scrum collaboration': 'Agile / Scrum',

      // Quality Engineering
      'automated testing': 'Automated Testing',
      'e2e testing': 'E2E Testing',
      'unit testing': 'Unit Testing',
      'selenium': 'Selenium',
      'cypress': 'Cypress',
      'playwright': 'Playwright',
      'jest': 'Jest',
      'qa': 'QA',

      // Cybersecurity
      'cybersecurity': 'Cybersecurity',
      'vulnerability assessment': 'Vulnerability Assessment',
      'owasp': 'OWASP',
      'penetration testing': 'Penetration Testing',

      // UI/UX
      'figma': 'Figma',
      'ui/ux': 'UI/UX Design',
      'ui/ux design': 'UI/UX Design',
      'design systems': 'Design Systems',
      'design system': 'Design Systems',
      'wireframing': 'Wireframing & Prototyping',
      'prototyping': 'Wireframing & Prototyping',
      'wireframing & prototyping': 'Wireframing & Prototyping',
      'user research': 'User Research'
    };

    return aliasMap[lower] || trimmed;
  }

  classifySkillCategory(skillName: string, existingCategory?: string): string {
    const sName = (skillName || '').trim().toLowerCase();
    const existing = (existingCategory || '').trim();

    // 1. Specific skill name mappings (highest precision)
    const skillCategoryMap: { [key: string]: string } = {
      // Databases
      'sqlite': 'Database',
      'sqlite3': 'Database',
      'postgresql': 'Database',
      'postgres': 'Database',
      'mysql': 'Database',
      'mongodb': 'Database',
      'mongo': 'Database',
      'supabase': 'Database',
      'firebase': 'Database',
      'firestore': 'Database',
      'firebase firestore': 'Database',
      'redis': 'Database',
      'oracle': 'Database',
      'mariadb': 'Database',
      'cassandra': 'Database',
      'dynamodb': 'Database',
      'sql server': 'Database',
      'mssql': 'Database',
      'sql': 'Database',
      'relational database': 'Database',
      'relational database design': 'Database',
      'vector databases': 'Database',
      'chromadb': 'Database',
      'pinecone': 'Database',
      'prisma': 'Database',
      'typeorm': 'Database',
      'mongoose': 'Database',

      // Frontend Development
      'html': 'Frontend Development',
      'css': 'Frontend Development',
      'html/css': 'Frontend Development',
      'html5': 'Frontend Development',
      'css3': 'Frontend Development',
      'tailwind': 'Frontend Development',
      'tailwind css': 'Frontend Development',
      'tailwindcss': 'Frontend Development',
      'bootstrap': 'Frontend Development',
      'sass': 'Frontend Development',
      'scss': 'Frontend Development',
      'jquery': 'Frontend Development',
      'responsive web design': 'Frontend Development',
      'pwa': 'Frontend Development',
      'progressive web apps': 'Frontend Development',
      'progressive web app': 'Frontend Development',

      // Frameworks & Libraries
      'react': 'Framework',
      'react.js': 'Framework',
      'reactjs': 'Framework',
      'angular': 'Framework',
      'angularjs': 'Framework',
      'angular.js': 'Framework',
      'vue': 'Framework',
      'vue.js': 'Framework',
      'vuejs': 'Framework',
      'next.js': 'Framework',
      'nextjs': 'Framework',
      'next': 'Framework',
      'nuxt.js': 'Framework',
      'nuxtjs': 'Framework',
      'nuxt': 'Framework',
      'svelte': 'Framework',
      'fastapi': 'Framework',
      'fast api': 'Framework',
      'express': 'Framework',
      'express.js': 'Framework',
      'expressjs': 'Framework',
      'django': 'Framework',
      'flask': 'Framework',
      'spring boot': 'Framework',
      'spring': 'Framework',
      'springboot': 'Framework',
      'laravel': 'Framework',
      'nestjs': 'Framework',
      'nest': 'Framework',
      'node.js': 'Framework',
      'nodejs': 'Framework',
      'node': 'Framework',
      'flutter': 'Framework',
      'react native': 'Framework',
      'asp.net': 'Framework',
      'asp.net core': 'Framework',
      '.net': 'Framework',
      '.net core': 'Framework',
      'dotnet': 'Framework',
      'ruby on rails': 'Framework',
      'rails': 'Framework',

      // Tools & DevOps
      'git': 'Tool & DevOps',
      'github': 'Tool & DevOps',
      'gitlab': 'Tool & DevOps',
      'docker': 'Tool & DevOps',
      'docker compose': 'Tool & DevOps',
      'kubernetes': 'Tool & DevOps',
      'k8s': 'Tool & DevOps',
      'ci/cd': 'Tool & DevOps',
      'cicd': 'Tool & DevOps',
      'github actions': 'Tool & DevOps',
      'aws': 'Tool & DevOps',
      'azure': 'Tool & DevOps',
      'gcp': 'Tool & DevOps',
      'google cloud': 'Tool & DevOps',
      'linux': 'Tool & DevOps',
      'ubuntu': 'Tool & DevOps',
      'nginx': 'Tool & DevOps',
      'apache': 'Tool & DevOps',
      'terraform': 'Tool & DevOps',
      'ansible': 'Tool & DevOps',
      'jenkins': 'Tool & DevOps',
      'postman': 'Tool & DevOps',
      'vercel': 'Tool & DevOps',
      'netlify': 'Tool & DevOps',
      'heroku': 'Tool & DevOps',
      'vite': 'Tool & DevOps',
      'expo': 'Tool & DevOps',
      'vs code': 'Tool & DevOps',
      'vscode': 'Tool & DevOps',
      'visual studio code': 'Tool & DevOps',
      'devops': 'Tool & DevOps',

      // Programming Languages
      'javascript': 'Programming Language',
      'js': 'Programming Language',
      'typescript': 'Programming Language',
      'ts': 'Programming Language',
      'python': 'Programming Language',
      'py': 'Programming Language',
      'java': 'Programming Language',
      'c++': 'Programming Language',
      'cpp': 'Programming Language',
      'cplusplus': 'Programming Language',
      'c#': 'Programming Language',
      'csharp': 'Programming Language',
      'c': 'Programming Language',
      'php': 'Programming Language',
      'ruby': 'Programming Language',
      'go': 'Programming Language',
      'golang': 'Programming Language',
      'rust': 'Programming Language',
      'swift': 'Programming Language',
      'kotlin': 'Programming Language',
      'dart': 'Programming Language',
      'r': 'Programming Language',
      'scala': 'Programming Language',
      'bash': 'Programming Language',
      'shell': 'Programming Language',
      'powershell': 'Programming Language',
      'solidity': 'Programming Language',

      // Computer Science & Core
      'data structures & algorithms': 'Computer Science',
      'data structures': 'Computer Science',
      'algorithms': 'Computer Science',
      'dsa': 'Computer Science',
      'software engineering': 'Computer Science',
      'algorithms & systems': 'Computer Science',
      'system design': 'Computer Science',
      'system architecture': 'Computer Science',

      // Backend Development
      'rest api': 'Backend Development',
      'restful api': 'Backend Development',
      'restful apis': 'Backend Development',
      'rest apis': 'Backend Development',
      'rest': 'Backend Development',
      'restful': 'Backend Development',
      'graphql': 'Backend Development',
      'microservices': 'Backend Development',
      'microservice': 'Backend Development',
      'websockets': 'Backend Development',
      'grpc': 'Backend Development',
      'backend development': 'Backend Development',

      // Professional & Soft Skills
      'adaptability': 'Professional Skills',
      'problem solving': 'Professional Skills',
      'code reviews': 'Professional Skills',
      'technical documentation': 'Professional Skills',
      'communication': 'Professional Skills',
      'teamwork': 'Professional Skills',
      'team collaboration': 'Professional Skills',
      'collaboration': 'Professional Skills',
      'leadership': 'Professional Skills',
      'critical thinking': 'Professional Skills',
      'time management': 'Professional Skills',

      // AI & Data Science
      'machine learning': 'AI & Data Science',
      'deep learning': 'AI & Data Science',
      'artificial intelligence': 'AI & Data Science',
      'ai': 'AI & Data Science',
      'ml': 'AI & Data Science',
      'ai / ml': 'AI & Data Science',
      'ai/ml': 'AI & Data Science',
      'ai & ml': 'AI & Data Science',
      'ai & data science': 'AI & Data Science',
      'ai / data science': 'AI & Data Science',
      'nlp': 'AI & Data Science',
      'natural language processing': 'AI & Data Science',
      'computer vision': 'AI & Data Science',
      'pytorch': 'AI & Data Science',
      'tensorflow': 'AI & Data Science',
      'keras': 'AI & Data Science',
      'scikit-learn': 'AI & Data Science',
      'pandas': 'AI & Data Science',
      'numpy': 'AI & Data Science',
      'matplotlib': 'AI & Data Science',
      'seaborn': 'AI & Data Science',
      'data science': 'AI & Data Science',
      'data engineering': 'AI & Data Science',
      'llm': 'AI & Data Science',
      'llms': 'AI & Data Science',
      'genai': 'AI & Data Science',
      'generative ai': 'AI & Data Science',
      'rag': 'AI & Data Science',
      'retrieval-augmented generation (rag)': 'AI & Data Science',
      'retrieval-augmented generation': 'AI & Data Science',
      'retrieval augmented generation': 'AI & Data Science',
      'mlops': 'AI & Data Science',
      'langchain': 'AI & Data Science',
      'huggingface': 'AI & Data Science',
      'openai': 'AI & Data Science',
      'spark': 'AI & Data Science',
      'pyspark': 'AI & Data Science',
      'kafka': 'AI & Data Science',
      'etl pipelines': 'AI & Data Science',
      'etl': 'AI & Data Science',
      'data visualization': 'AI & Data Science',

      // UI/UX Design
      'figma': 'UI/UX Design',
      'ui/ux design': 'UI/UX Design',
      'ui/ux': 'UI/UX Design',
      'design systems': 'UI/UX Design',
      'design system': 'UI/UX Design',
      'wireframing & prototyping': 'UI/UX Design',
      'wireframing': 'UI/UX Design',
      'prototyping': 'UI/UX Design',
      'user research': 'UI/UX Design',

      // Quality Engineering & Testing
      'automated testing': 'Quality Engineering',
      'e2e testing': 'Quality Engineering',
      'unit testing': 'Quality Engineering',
      'selenium': 'Quality Engineering',
      'cypress': 'Quality Engineering',
      'playwright': 'Quality Engineering',
      'jest': 'Quality Engineering',
      'qa': 'Quality Engineering',

      // Cybersecurity
      'cybersecurity': 'Cybersecurity',
      'vulnerability assessment': 'Cybersecurity',
      'owasp': 'Cybersecurity',
      'security best practices (owasp)': 'Cybersecurity',
      'security best practices': 'Cybersecurity',
      'penetration testing': 'Cybersecurity',

      // Product Management
      'product management': 'Product Management',
      'agile / scrum': 'Product Management',
      'scrum': 'Product Management',
      'agile': 'Product Management',
      'agile / scrum collaboration': 'Product Management',

      // Compound & Specialized Skills
      'advanced typescript patterns': 'Programming Language',
      'typescript patterns': 'Programming Language',
      'ci/cd pipeline automation': 'Tool & DevOps',
      'ci/cd pipeline': 'Tool & DevOps',
      'pipeline automation': 'Tool & DevOps',
      'docker & kubernetes orchestration': 'Tool & DevOps',
      'docker & kubernetes': 'Tool & DevOps',
      'kubernetes orchestration': 'Tool & DevOps',
      'container orchestration': 'Tool & DevOps',
      'production monitoring & observability': 'Tool & DevOps',
      'production monitoring': 'Tool & DevOps',
      'monitoring & observability': 'Tool & DevOps',
      'observability': 'Tool & DevOps',
      'monitoring': 'Tool & DevOps',
      'computer vision integration': 'AI & Data Science',
      'restful api design': 'Backend Development',
      'api design': 'Backend Development',
      'system design & scalability': 'Computer Science',
      'scalability': 'Computer Science'
    };

    if (skillCategoryMap[sName]) {
      return skillCategoryMap[sName];
    }

    // 2. Normalize existing category names if present
    if (existing) {
      const exLower = existing.toLowerCase().trim();
      if (
        exLower === 'ai / ml' || 
        exLower === 'ai/ml' || 
        exLower === 'ai & ml' || 
        exLower === 'ai / data science' || 
        exLower === 'ai & data science' || 
        exLower === 'ai concept' || 
        exLower === 'ml library' || 
        exLower === 'deep learning library' ||
        exLower === 'data science'
      ) {
        return 'AI & Data Science';
      }
      if (exLower === 'frontend framework' || exLower === 'web framework' || exLower === 'mobile framework') {
        return 'Framework';
      }
      if (exLower === 'database / query' || exLower === 'embedded relational database' || exLower === 'relational database' || exLower === 'nosql document database') {
        return 'Database';
      }
      if (exLower === 'web markup' || exLower === 'markup' || exLower === 'styling' || exLower === 'frontend' || exLower === 'frontend development' || exLower === 'ui styling') {
        return 'Frontend Development';
      }
      if (exLower === 'devops tool' || exLower === 'orchestration tool' || exLower === 'version control' || exLower === 'operating system' || exLower === 'devops') {
        return 'Tool & DevOps';
      }
      if (exLower === 'professional skills' || exLower === 'soft skills') {
        return 'Professional Skills';
      }
      if (exLower === 'computer science') {
        return 'Computer Science';
      }
      if (exLower === 'programming language' || exLower === 'language') {
        return 'Programming Language';
      }
      // Re-classify any legacy 'full-stack' category to actual domain
      if (exLower.includes('full-stack') || exLower.includes('full stack') || exLower === 'fullstack') {
        if (sName.includes('typescript') || sName.includes('javascript') || sName.includes('python') || sName.includes('lang')) return 'Programming Language';
        if (sName.includes('docker') || sName.includes('kubernetes') || sName.includes('ci/cd') || sName.includes('devops') || sName.includes('monitor') || sName.includes('observ') || sName.includes('cloud')) return 'Tool & DevOps';
        if (sName.includes('vision') || sName.includes('ai') || sName.includes('ml') || sName.includes('nlp') || sName.includes('data')) return 'AI & Data Science';
        if (sName.includes('security') || sName.includes('owasp') || sName.includes('auth')) return 'Cybersecurity';
        if (sName.includes('api') || sName.includes('rest') || sName.includes('backend') || sName.includes('server') || sName.includes('graphql')) return 'Backend Development';
        if (sName.includes('system') || sName.includes('scalability') || sName.includes('algorithm') || sName.includes('architecture')) return 'Computer Science';
        if (sName.includes('css') || sName.includes('html') || sName.includes('front') || sName.includes('ui') || sName.includes('react') || sName.includes('angular') || sName.includes('vue')) return 'Frontend Development';
        return 'Backend Development';
      }
      return existing;
    }

    // 3. Heuristic fallback based on name tokens
    if (sName.includes('sql') || sName.includes('db') || sName.includes('database')) return 'Database';
    if (sName.includes('css') || sName.includes('html') || sName.includes('web') || sName.includes('frontend')) return 'Frontend Development';
    if (sName.includes('tool') || sName.includes('devops') || sName.includes('cloud') || sName.includes('deploy') || sName.includes('docker') || sName.includes('kubernetes') || sName.includes('ci/cd') || sName.includes('monitor')) return 'Tool & DevOps';
    if (sName.includes('manage') || sName.includes('leader') || sName.includes('collaborat') || sName.includes('document') || sName.includes('problem') || sName.includes('adapt')) return 'Professional Skills';
    if (sName.includes('security') || sName.includes('owasp') || sName.includes('cyber')) return 'Cybersecurity';
    if (sName.includes('vision') || sName.includes('nlp') || sName.includes('learning') || sName.includes('intelligence')) return 'AI & Data Science';
    if (sName.includes('system') || sName.includes('algorithm') || sName.includes('scalab')) return 'Computer Science';
    if (sName.includes('api') || sName.includes('rest') || sName.includes('endpoint')) return 'Backend Development';

    return 'Framework';
  }


  private async autoMigrateOutdatedSkillCategories(skillsList: Skill[]) {
    for (const s of skillsList) {
      const canonical = this.classifySkillCategory(s.name, s.category);
      if (canonical !== s.category) {
        try {
          await this.skillService.updateSkillCategory(s.id, canonical);
          s.category = canonical;
        } catch (err) {
          console.warn('Auto-migrating skill category warning:', s.name, err);
        }
      }
    }
  }

  async fetchSkills() {
    const { data, error } = await this.skillService.getSkills();
    if (!error && data) {
      const mappedSkills = (data as Skill[]).map(s => ({
        ...s,
        category: this.classifySkillCategory(s.name, s.category)
      }));
      this.skills.set(mappedSkills);
      // Auto-migrate any unclassified or legacy category in database
      this.autoMigrateOutdatedSkillCategories(data as Skill[]);
    }
  }

  async createNewSkill() {
    if (!this.newSkillName.trim()) return;
    const category = this.classifySkillCategory(this.newSkillName.trim(), this.newSkillCategory);
    const { data, error } = await this.skillService.createSkill(
      this.newSkillName.trim(),
      category
    );
    if (error) {
      this.showToast('Error creating skill: ' + error.message, 'error');
    } else {
      const added = this.newSkillName;
      this.newSkillName = '';
      await this.fetchSkills();
      this.showToast(`Skill "${added}" added to catalog!`, 'success');
    }
  }

  async deleteSkillFromCatalog(id: string, name: string) {
    this.openConfirmDialog({
      title: 'Delete Catalog Skill',
      message: `Are you sure you want to delete "${name}" from the skills catalog?`,
      confirmText: 'Delete Skill',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete',
      onConfirm: async () => {
        const { error } = await this.skillService.deleteSkill(id);
        if (error) {
          this.showToast('Error deleting skill: ' + error.message, 'error');
        } else {
          await this.fetchSkills();
          this.showToast(`Skill "${name}" deleted from catalog.`, 'success');
        }
      }
    });
  }

  setSkillsSubView(view: 'my-skills' | 'catalog') {
    this.skillsSubView.set(view);
  }

  setSkillCategoryFilter(category: string) {
    this.skillCategoryFilter.set(category);
  }

  clearSkillFilters() {
    this.skillSearchQuery.set('');
    this.skillCategoryFilter.set('all');
  }

  getSkillCategories(): string[] {
    const detailed = this.getUserSkillsDetailed();
    const catSet = new Set<string>();
    detailed.forEach(s => {
      if (s.category) catSet.add(s.category);
    });
    return Array.from(catSet).sort();
  }

  getFilteredUserSkills(): { name: string; category: string; count: number; projectNames: string[] }[] {
    const q = (this.skillSearchQuery() || '').toLowerCase().trim();
    const filter = this.skillCategoryFilter();
    const detailed = this.getUserSkillsDetailed();

    return detailed.filter(s => {
      const matchesCat = filter === 'all' || s.category.toLowerCase() === filter.toLowerCase();
      if (!matchesCat) return false;
      if (!q) return true;
      const nameMatch = s.name.toLowerCase().includes(q);
      const catMatch = s.category.toLowerCase().includes(q);
      const projMatch = s.projectNames.some(p => p.toLowerCase().includes(q));
      return nameMatch || catMatch || projMatch;
    });
  }

  getSkillCountByCategory(category: string): number {
    if (category === 'all') return this.getUserSkillsDetailed().length;
    return this.getUserSkillsDetailed().filter(s => s.category.toLowerCase() === category.toLowerCase()).length;
  }

  toggleSkillProjectsExpand(skillName: string) {
    const current = this.expandedSkillMap();
    this.expandedSkillMap.set({
      ...current,
      [skillName]: !current[skillName]
    });
  }

  isSkillProjectsExpanded(skillName: string): boolean {
    return !!this.expandedSkillMap()[skillName];
  }

  navigateToProject(projectName: string) {
    if (!projectName) return;
    const trimmed = projectName.trim().toLowerCase();
    
    // Check for exact, prefix, or substring match in active projects
    const target = this.projects().find(p => p.name && p.name.trim().toLowerCase() === trimmed)
      || this.projects().find(p => p.name && p.name.toLowerCase().includes(trimmed))
      || this.projects().find(p => p.name && trimmed.includes(p.name.toLowerCase()));

    // Reset filters so the target card is rendered
    this.projectStatusFilter.set('all');
    this.projectSearchQuery.set('');

    // Switch to projects tab
    this.setTab('projects');

    if (target) {
      this.highlightedProjectId.set(target.id);
      setTimeout(() => {
        const el = document.getElementById('project-card-' + target.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      setTimeout(() => {
        this.highlightedProjectId.set('');
      }, 3500);
    }
  }

  getUserSkillsDetailed(): { name: string; category: string; count: number; projectNames: string[] }[] {
    const skillMap = new Map<string, { name: string; category: string; count: number; projectNames: string[] }>();
    for (const p of this.projects()) {
      if (p.project_skills && p.project_skills.length > 0) {
        // Collect unique canonical skills within THIS specific project
        const projectCanonicalSkills = new Map<string, { canonicalName: string; category: string }>();

        for (const ps of p.project_skills) {
          const s = ps.skills;
          if (s?.name) {
            const canonicalName = this.getCanonicalSkillName(s.name);
            const key = canonicalName.toLowerCase();
            const normalizedCategory = this.classifySkillCategory(canonicalName, s.category);
            if (!projectCanonicalSkills.has(key)) {
              projectCanonicalSkills.set(key, { canonicalName, category: normalizedCategory });
            }
          }
        }

        // Record each canonical skill once per project
        for (const [key, { canonicalName, category }] of projectCanonicalSkills.entries()) {
          if (!skillMap.has(key)) {
            skillMap.set(key, {
              name: canonicalName,
              category: category,
              count: 1,
              projectNames: [p.name]
            });
          } else {
            const existing = skillMap.get(key)!;
            if (!existing.projectNames.includes(p.name)) {
              existing.projectNames.push(p.name);
            }
            existing.count = existing.projectNames.length;
            existing.category = category;
          }
        }
      }
    }
    return Array.from(skillMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  getSkillCategoryClass(category: string): string {
    const c = (category || '').toLowerCase().trim();
    if (c.includes('ai') || c.includes('ml') || c.includes('data science')) return 'cat-ai-data-science';
    if (c.includes('ai') || c.includes('ml') || c.includes('data science') || c.includes('deep learning')) return 'cat-ai-data-science';
    if (c.includes('ui') || c.includes('ux') || c.includes('design')) return 'cat-ui-ux';
    if (c.includes('front') || c.includes('markup') || c.includes('styling') || c.includes('css') || c.includes('html')) return 'cat-frontend-development';
    if (c.includes('front') || c.includes('markup') || c.includes('styling') || c.includes('css') || c.includes('html') || c.includes('pwa')) return 'cat-frontend-development';
    if (c.includes('prog') || c.includes('lang')) return 'cat-programming-language';
    if (c.includes('frame') || c.includes('lib')) return 'cat-framework';
    if (c.includes('data') || c.includes('sql') || c.includes('store')) return 'cat-database';
    if (c.includes('database') || c.includes('sql') || c.includes('store') || c.includes('db')) return 'cat-database';
    if (c.includes('devops') || c.includes('tool') || c.includes('cloud') || c.includes('infra')) return 'cat-tool-devops';
    if (c.includes('computer science') || c.includes('algorithm') || c.includes('software engineering')) return 'cat-computer-science';
    if (c.includes('prof') || c.includes('soft') || c.includes('mindset') || c.includes('problem') || c.includes('adapt') || c.includes('document')) return 'cat-professional-skills';
    if (c.includes('back') || c.includes('arch') || c.includes('api')) return 'cat-backend-development';
    if (c.includes('test') || c.includes('qa') || c.includes('quality')) return 'cat-qa';
    if (c.includes('sec') || c.includes('cyber')) return 'cat-security';
    if (c.includes('product')) return 'cat-product';
    if (c.includes('product') || c.includes('agile') || c.includes('scrum')) return 'cat-product';
    return 'cat-default';
  }

  async removeSkillFromUserPortfolio(skillName: string) {
    const canonicalTarget = this.getCanonicalSkillName(skillName).toLowerCase();
    this.openConfirmDialog({
      title: 'Remove Skill from Portfolio',
      message: `Are you sure you want to remove "${skillName}" from your active portfolio? This will detach it from your projects.`,
      confirmText: 'Remove Skill',
      cancelText: 'Keep Skill',
      type: 'danger',
      icon: 'delete',
      onConfirm: async () => {
        try {
          let removedCount = 0;
          for (const p of this.projects()) {
            if (p.project_skills) {
              for (const ps of p.project_skills) {
                const sName = ps.skills?.name;
                if (sName && (sName.toLowerCase() === skillName.toLowerCase() || this.getCanonicalSkillName(sName).toLowerCase() === canonicalTarget)) {
                  await this.skillService.removeSkillFromProject(p.id, ps.skill_id);
                  removedCount++;
                }
              }
            }
          }
          await this.fetchProjects();
          this.showToast(`Removed "${skillName}" from ${removedCount} project(s) in your portfolio.`, 'success');
        } catch (err: any) {
          this.showToast(`Failed to remove skill: ${err.message}`, 'error');
        }
      }
    });
  }

  // Career Roles & Skill Gap Operations
  async fetchCareerRoles() {
    const { data, error } = await this.careerRoleService.getCareerRoles();
    if (!error && data) {
      this.careerRoles.set(data as CareerRole[]);
      if (data.length > 0) {
        const savedRoleId = typeof localStorage !== 'undefined' ? localStorage.getItem('portfolioiq_selected_role_id') : null;
        const targetRole = (savedRoleId && data.find((r: any) => r.id === savedRoleId)) 
          ? data.find((r: any) => r.id === savedRoleId) 
          : data[0];
        
        if (targetRole) {
          await this.selectCareerRole(targetRole.id);
        }
      }
    }
  }

  async selectCareerRole(roleId: string) {
    this.selectedRoleId.set(roleId);
    const role = this.careerRoles().find(r => r.id === roleId) || null;
    this.selectedRole.set(role);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('portfolioiq_selected_role_id', roleId);
    }

    // Load Role-Specific cached optimization and AI blueprint if previously saved for this role
    this.loadRoleOptimizationCache(roleId);

    // Also sync Knowledge Graph if no explicit knowledge role is set
    if (role && !this.selectedKnowledgeRole()) {
      this.selectRoleTree(role.title);
    }
    await this.recalculateSkillGap();
  }

  private loadRoleOptimizationCache(roleId: string) {
    if (typeof localStorage === 'undefined' || !roleId) return;

    try {
      const optKey = `portfolioiq_opt_cache_${roleId}`;
      const savedOpt = localStorage.getItem(optKey);
      if (savedOpt) {
        this.optimizationResult.set(JSON.parse(savedOpt));
      } else {
        this.optimizationResult.set(null);
      }

      const aiKey = `portfolioiq_ai_blueprint_${roleId}`;
      const savedAi = localStorage.getItem(aiKey);
      if (savedAi) {
        this.customAiBlueprint.set(JSON.parse(savedAi));
      } else {
        this.customAiBlueprint.set(null);
      }

      // If AI blueprint is available and no knapsack result, show AI custom view, else curated
      if (savedAi && !savedOpt) {
        this.activeBlueprintView.set('ai_custom');
      } else {
        this.activeBlueprintView.set('curated');
      }
    } catch (e) {
      console.warn('Failed to parse role optimization cache:', e);
    }
  }

  async recalculateSkillGap() {
    if (!this.selectedRoleId()) return;

    const { data: roleSkillsData, error } = await this.careerRoleService.getRoleSkills(this.selectedRoleId());
    if (error || !roleSkillsData) return;

    const requiredSkillNames = roleSkillsData
      .map((item: any) => item.skills?.name)
      .filter((name: string) => !!name);

    const userSkillNames = this.getUserSkillNames();

    this.analyticsService.getSkillGap(userSkillNames, requiredSkillNames).subscribe({
      next: (res) => {
        this.skillGap.set(res);
        this.evaluateStrengthsAndWeaknesses();
      },
      error: (err) => console.error('Skill gap calculation failed:', err)
    });
  }

  getUserSkillNames(): string[] {
    return this.getUserSkillsDetailed().map(s => s.name);
  }

  // Project Operations
  async fetchProjects() {
    const { data, error } = await this.projectService.getProjects();
    if (error) {
      console.error('Failed to fetch projects:', error);
      return;
    }
    if (data) {
      this.projects.set(data);
      await this.recalculatePortfolioScore();
      await this.recalculateSkillGap();
      this.classifyAllProjectsWithMl();
    }
  }

  classifyAllProjectsWithMl() {
    for (const project of this.projects()) {
      const skills = (project.project_skills || [])
        .map((ps: any) => ps.skills?.name)
        .filter(Boolean);
      this.mlService.classifyProject(project.name, project.description || '', skills).subscribe({
        next: (res) => {
          this.mlPredictions.update(map => ({
            ...map,
            [project.id]: res
          }));
        },
        error: (err) => console.error('ML classification error for project:', project.name, err)
      });
    }
  }

  setNewProjectStatus(status: 'idea' | 'active' | 'completed') {
    this.newProjectStatus = status;
  }

  async updateProjectStatus(projectId: string, newStatus: string, projectName?: string) {
    const { data, error } = await this.projectService.updateProjectStatus(projectId, newStatus);
    if (error) {
      this.showToast('Failed to update project status: ' + error.message, 'error');
    } else {
      await this.fetchProjects();
      const statusLabel = newStatus === 'active' ? 'In Progress' : (newStatus === 'completed' ? 'Completed' : 'Idea');
      this.showToast(`Updated "${projectName || 'project'}" phase to ${statusLabel}!`, 'success');
    }
  }

  openEditProjectModal(project: any) {
    if (!project) return;
    this.editingProject.set(project);
    this.editProjectName = project.name || '';
    this.editProjectDesc = project.description || '';
    this.editProjectStatus = (project.status || 'idea') as 'idea' | 'active' | 'completed';
  }

  editCurrentAnalysisProject() {
    const proj = this.activeAnalysisProject();
    if (proj) {
      this.closeProjectAnalysis();
      this.openEditProjectModal(proj);
    }
  }

  closeEditProjectModal() {
    this.editingProject.set(null);
    this.editProjectName = '';
    this.editProjectDesc = '';
    this.isSavingProjectEdit.set(false);
  }

  async saveProjectEdits() {
    const proj = this.editingProject();
    if (!proj) return;

    if (!this.editProjectName.trim()) {
      this.showToast('Project title cannot be empty.', 'warning');
      return;
    }

    this.isSavingProjectEdit.set(true);
    const { data, error } = await this.projectService.updateProject(proj.id, {
      name: this.editProjectName.trim(),
      description: this.editProjectDesc.trim(),
      status: this.editProjectStatus
    });

    this.isSavingProjectEdit.set(false);

    if (error) {
      this.showToast('Failed to update project: ' + error.message, 'error');
    } else {
      const updatedName = this.editProjectName.trim();
      this.closeEditProjectModal();
      await this.fetchProjects();
      this.showToast(`Successfully updated "${updatedName}"!`, 'success');
    }
  }

  async createProject() {
    if (!this.newProjectName.trim()) {
      this.showToast('Please enter a project name.', 'warning');
      return;
    }
    const { data, error } = await this.projectService.createProject(
      this.newProjectName.trim(),
      this.newProjectDesc.trim(),
      this.newProjectStatus || 'idea'
    );
    if (error) {
      this.showToast('Failed to create project: ' + error.message, 'error');
    } else {
      const proj = this.newProjectName;
      this.newProjectName = '';
      this.newProjectDesc = '';
      this.newProjectStatus = 'idea';
      this.showAddProjectForm.set(false);
      await this.fetchProjects();
      this.showToast(`Project "${proj}" created successfully!`, 'success');
    }
  }

  toggleAddProjectForm() {
    this.showAddProjectForm.update(v => !v);
  }

  openAddProjectWithCurrentFilter() {
    const filter = this.projectStatusFilter();
    if (filter !== 'all') {
      this.newProjectStatus = filter;
    }
    this.showAddProjectForm.set(true);
  }

  setProjectStatusFilter(status: 'all' | 'active' | 'completed' | 'idea') {
    this.projectStatusFilter.set(status);
  }

  clearProjectFilters() {
    this.projectSearchQuery.set('');
    this.projectStatusFilter.set('all');
  }

  getFilteredProjects(): any[] {
    const q = (this.projectSearchQuery() || '').toLowerCase().trim();
    const filter = this.projectStatusFilter();
    return this.projects().filter(p => {
      const matchesFilter = filter === 'all' || p.status === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      const nameMatch = p.name?.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      const skillMatch = p.project_skills?.some((ps: any) => ps.skills?.name?.toLowerCase().includes(q));
      const mlMatch = this.mlPredictions()[p.id]?.predicted_category?.toLowerCase().includes(q);
      return nameMatch || descMatch || skillMatch || mlMatch;
    });
  }

  getProjectCountByStatus(status: 'all' | 'active' | 'completed' | 'idea'): number {
    if (status === 'all') return this.projects().length;
    return this.projects().filter(p => p.status === status).length;
  }

  deleteProject(id: string, projectName?: string) {
    const name = projectName || this.projects().find(p => p.id === id)?.name || 'this project';
    this.openConfirmDialog({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${name}" from your portfolio? This action cannot be undone.`,
      confirmText: 'Delete Project',
      cancelText: 'Keep Project',
      type: 'danger',
      icon: 'delete',
      onConfirm: async () => {
        await this.projectService.deleteProject(id);
        await this.fetchProjects();
        this.showToast(`Project "${name}" deleted from portfolio.`, 'info');
      }
    });
  }

  async attachSkillToProject(projectId: string, skillId: string) {
    if (!skillId) return;
    const { error } = await this.skillService.addSkillToProject(projectId, skillId);
    if (error) {
      console.error('Skill attachment error:', error);
    } else {
      await this.fetchProjects();
    }
  }

  async detachSkillFromProject(projectId: string, skillId: string, skillName?: string) {
    const proj = this.projects().find(p => p.id === projectId);
    const sName = skillName || this.skills().find(s => s.id === skillId)?.name || 'Skill';

    const { error } = await this.skillService.removeSkillFromProject(projectId, skillId);
    if (error) {
      console.error('Skill detach error:', error);
      this.showToast(`Failed to remove ${sName}: ${error.message}`, 'error');
    } else {
      await this.fetchProjects();
      this.showToast(
        `Detached "${sName}" from ${proj?.name || 'project'}`,
        'info',
        6000,
        'Undo',
        async () => {
          const { error: attachErr } = await this.skillService.addSkillToProject(projectId, skillId);
          if (!attachErr) {
            await this.fetchProjects();
            this.showToast(`Restored "${sName}" to ${proj?.name || 'project'}!`, 'success');
          }
        }
      );
    }
  }

  toggleProjectSkillsExpanded(projectId: string) {
    this.expandedProjectSkills.update(map => ({
      ...map,
      [projectId]: !map[projectId]
    }));
  }

  isProjectSkillsExpanded(projectId: string): boolean {
    return !!this.expandedProjectSkills()[projectId];
  }

  toggleProjectDescExpanded(projectId: string) {
    this.expandedProjectDescs.update(map => ({
      ...map,
      [projectId]: !map[projectId]
    }));
  }

  isProjectDescExpanded(projectId: string): boolean {
    return !!this.expandedProjectDescs()[projectId];
  }

  openProjectAnalysis(project: any) {
    this.activeAnalysisProject.set(project);
    if (project?.id) {
      const skills = (project.project_skills || [])
        .map((ps: any) => ps.skills?.name)
        .filter(Boolean);
      this.mlService.classifyProject(project.name, project.description || '', skills).subscribe({
        next: (res) => {
          this.mlPredictions.update(map => ({
            ...map,
            [project.id]: res
          }));
        },
        error: (err) => console.error('ML classification refresh error:', err)
      });
    }
  }

  closeProjectAnalysis() {
    this.activeAnalysisProject.set(null);
  }

  // Portfolio Analytics
  async recalculatePortfolioScore() {
    const projectItems = this.projects().map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      status: p.status || 'active'
    }));

    const totalUniqueSkills = this.getUserSkillNames().length;

    this.analyticsService.getPortfolioScore(projectItems, totalUniqueSkills).subscribe({
      next: (res) => {
        this.portfolioScore.set(res);
        this.evaluateStrengthsAndWeaknesses();
      },
      error: (err) => console.error('Portfolio score calculation failed:', err)
    });
  }

  evaluateStrengthsAndWeaknesses() {
    const score = this.portfolioScore();
    const gap = this.skillGap();
    if (!score) return;

    const s: string[] = [];
    const w: string[] = [];

    if (score.overall_health_score >= 70) {
      s.push('Strong overall technical portfolio health score');
    } else {
      w.push('Overall portfolio health score requires improvement');
    }

    if (score.metrics.project_volume_score >= 15) {
      s.push('Good developer project activity & volume');
    } else {
      w.push('Limited project volume (recommend creating more projects)');
    }

    if (score.metrics.skill_diversity_score >= 20) {
      s.push('Diverse technical coverage across frameworks and databases');
    } else {
      w.push('Low skill diversity (acquire more frameworks/tools)');
    }

    if (gap && gap.missing_skills.length > 0) {
      w.push(`Missing ${gap.missing_skills.length} target skills for ${this.selectedRole()?.title || 'career role'}`);
    } else if (gap && gap.matching_skills.length > 0) {
      s.push(`High skill alignment with target role (${this.selectedRole()?.title})`);
    }

    this.strengthsList.set(s);
    this.weaknessesList.set(w);
  }

  openScoreInfoModal() {
    this.showScoreInfoModal.set(true);
  }

  closeScoreInfoModal() {
    this.showScoreInfoModal.set(false);
  }

  // Resume Upload Handler
  onResumeUpload(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.showToast('Please select a valid PDF file.', 'warning');
      return;
    }

    // Convert file to Base64 Data URL for viewing & saving to user cloud profile
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      this.resumeParsing.set(true);
      this.analyticsService.parseResume(file).subscribe({
        next: async (res) => {
          this.resumeParsing.set(false);
          this.resumeData.set(res);

          // If user is logged in, automatically save resume to user's Supabase profile
          if (this.currentUser()) {
            await this.saveResumeToUserCloud(file, dataUrl, res.extracted_skills?.length || 0);
          } else {
            // Unauthenticated: preview in local session only
            this.savedResumeMeta.set({
              fileName: file.name,
              uploadedAt: new Date().toISOString(),
              dataUrl: dataUrl,
              extractedSkillsCount: res.extracted_skills?.length || 0
            });
            this.resumePdfUrlSafe.set(this.formatPdfViewerUrl(dataUrl));
          }

          this.showToast(`Resume Parsed Successfully! Extracted ${res.extracted_skills.length} skills.`, 'success');
        },
        error: (err) => {
          this.resumeParsing.set(false);
          this.showToast('Resume Extraction Failed: ' + (err.error?.detail || err.message), 'error');
        }
      });
    };
    reader.readAsDataURL(file);
  }

  async saveResumeToUserCloud(file: File, dataUrl: string, skillsCount: number) {
    const user = this.currentUser();
    if (!user) return;
    this.isSavingResume.set(true);

    let publicUrl = null;
    const { publicUrl: url, error: uploadErr } = await this.authService.uploadResume(file, user.id);
    if (uploadErr) {
      this.showToast('Warning: Could not upload PDF to storage. Preview may be unavailable.', 'warning');
    } else {
      publicUrl = url;
    }

    const resumePayload = {
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      extractedSkillsCount: skillsCount,
      dataUrl: publicUrl, // Store the public Supabase Storage URL
      extracted_skills: this.resumeData()?.extracted_skills || [],
      extracted_projects: this.resumeData()?.extracted_projects || []
    };

    try {
      const { data, error } = await this.authService.updateUserData({
        portfolio_resume: resumePayload
      });

      if (error) {
        console.error('Error saving resume to Supabase cloud profile:', error);
        this.showToast('Failed to save resume to cloud: ' + error.message, 'error');
      } else {
        this.savedResumeMeta.set(resumePayload);
        this.resumePdfUrlSafe.set(this.formatPdfViewerUrl(publicUrl || dataUrl));
        this.showToast('Resume permanently saved to your cloud profile!', 'success');
      }
    } catch (err: any) {
      console.error('Save resume error:', err);
    } finally {
      this.isSavingResume.set(false);
    }
  }

  getResumeExtractedSkills(): string[] {
    const fromData = this.resumeData()?.extracted_skills;
    if (fromData && fromData.length > 0) return fromData;

    const fromMeta = this.savedResumeMeta()?.extracted_skills;
    if (fromMeta && fromMeta.length > 0) return fromMeta;

    // Fallback to active portfolio skills if available
    const userSkills = this.getUserSkillNames();
    if (userSkills && userSkills.length > 0) return userSkills.slice(0, 14);

    return [];
  }

  getResumeExtractedProjects(): any[] {
    const fromData = this.resumeData()?.extracted_projects;
    if (fromData && fromData.length > 0) return fromData;

    const fromMeta = this.savedResumeMeta()?.extracted_projects;
    if (fromMeta && fromMeta.length > 0) return fromMeta;

    return [];
  }

  getResumeAtsScore(): number {
    const skills = this.getResumeExtractedSkills();
    const projects = this.getResumeExtractedProjects();
    let score = 70;
    if (skills.length >= 12) score += 18;
    else score += Math.round((skills.length / 12) * 18);

    if (projects.length >= 2) score += 10;
    else if (projects.length === 1) score += 6;
    else score += 2;

    return Math.min(score, 98);
  }

  getResumeRoleAlignment() {
    const targetRole = this.currentUser()?.target_role || 'Full-Stack Developer';
    const roleKey = targetRole.toLowerCase();

    const roleSkillRequirements: { [key: string]: string[] } = {
      'full-stack developer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'RESTful APIs', 'Git'],
      'frontend developer': ['JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'HTML/CSS', 'Tailwind CSS', 'Git'],
      'backend developer': ['Python', 'Node.js', 'PostgreSQL', 'MongoDB', 'Docker', 'RESTful APIs', 'Redis', 'Microservices'],
      'ai / ml engineer': ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy', 'Machine Learning', 'FastAPI'],
      'devops engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'GitHub Actions', 'PostgreSQL'],
      'data engineer': ['Python', 'SQL', 'PostgreSQL', 'Apache Spark', 'Pandas', 'Docker', 'Data Pipelines', 'ETL'],
      'mobile developer': ['Flutter', 'React Native', 'Swift', 'Kotlin', 'RESTful APIs', 'Firebase', 'Git'],
      'qa engineer': ['Automated Testing', 'Jest', 'Cypress', 'Selenium', 'Playwright', 'Unit Testing', 'CI/CD']
    };

    const roleObj = this.careerRoles().find(r => (r.title || '').toLowerCase() === roleKey);
    const requiredSkills: string[] = roleObj?.required_skills || (roleObj as any)?.skills || roleSkillRequirements[roleKey] || [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Git', 'RESTful APIs'
    ];

    const extractedSkills = this.getResumeExtractedSkills();
    const matching = requiredSkills.filter(req => extractedSkills.some(s => s.toLowerCase() === req.toLowerCase()));
    const missing = requiredSkills.filter(req => !extractedSkills.some(s => s.toLowerCase() === req.toLowerCase()));
    const matchPercentage = requiredSkills.length > 0 ? Math.round((matching.length / requiredSkills.length) * 100) : 75;

    return {
      targetRole,
      requiredSkills,
      matching,
      missing,
      matchPercentage
    };
  }

  auditResumeWithCoach() {
    const meta = this.savedResumeMeta();
    const fileName = meta?.fileName || 'Uploaded Resume';
    const targetRole = this.selectedRole()?.title || this.currentUser()?.target_role || 'Software Engineer';

    this.setTab('coach');
    const auditPrompt = `Please audit my uploaded resume ("${fileName}") for the ${targetRole} role and provide 3 high-impact STAR bullet points.`;
    this.sendCoachMessage(auditPrompt);
  }

  openResumeViewer() {
    const dataUrl = this.savedResumeMeta()?.dataUrl;
    if (!dataUrl) {
      this.showToast('No saved resume found to display.', 'warning');
      return;
    }
    this.resumePdfUrlSafe.set(this.formatPdfViewerUrl(dataUrl));
    this.showResumeModal.set(true);
  }

  closeResumeViewer() {
    this.showResumeModal.set(false);
  }

  deleteSavedResume() {
    this.openConfirmDialog({
      title: 'Delete Cloud Resume',
      message: 'Are you sure you want to remove your saved resume PDF from your cloud profile?',
      confirmText: 'Delete Resume',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'delete',
      onConfirm: async () => {
        if (this.currentUser()) {
          const { error } = await this.authService.updateUserData({
            portfolio_resume: null
          });
          if (error) {
            this.showToast('Failed to delete resume: ' + error.message, 'error');
            return;
          }
        }

        this.savedResumeMeta.set(null);
        this.resumePdfUrlSafe.set(null);
        this.resumeData.set(null);
        this.showToast('Resume deleted from your cloud profile.', 'info');
      }
    });
  }

  isResumeSkillInPortfolio(skillName: string): boolean {
    const canonicalTarget = this.getCanonicalSkillName(skillName).toLowerCase();
    return this.getUserSkillNames().some(s => s.toLowerCase() === skillName.toLowerCase() || this.getCanonicalSkillName(s).toLowerCase() === canonicalTarget);
  }

  private async getOrCreateResumeProject(): Promise<any> {
    const RESUME_PROJECT_NAME = 'Verified Resume Skills (NLP Extracted)';
    const existing = this.projects().find(p => p.name.toLowerCase() === RESUME_PROJECT_NAME.toLowerCase());
    if (existing) return existing;

    const { data, error } = await this.projectService.createProject(
      RESUME_PROJECT_NAME,
      'Automatically created to verify technical competencies extracted from candidate PDF resume.'
    );
    if (error) {
      console.error('Failed to create resume project:', error);
      throw error;
    }
    return data;
  }

  async importExtractedSkill(skillName: string) {
    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }

    try {
      const canonicalName = this.getCanonicalSkillName(skillName);

      // 1. Ensure skill exists in global catalog or insert it
      let skillObj = this.skills().find(s => s.name.toLowerCase() === canonicalName.toLowerCase() || s.name.toLowerCase() === skillName.toLowerCase());
      if (!skillObj) {
        const canonicalCat = this.classifySkillCategory(canonicalName);
        const { data: createdSkill, error } = await this.skillService.createSkill(canonicalName, canonicalCat);
        if (error) {
          this.showToast(`Failed to register skill ${canonicalName}: ${error.message}`, 'error');
          return;
        }
        skillObj = createdSkill;
        await this.fetchSkills();
      }

      // 2. Attach to user's resume project
      const resumeProject = await this.getOrCreateResumeProject();
      if (!resumeProject || !skillObj) return;

      // Check if already attached to this project
      const alreadyAttached = (resumeProject.project_skills || []).some(
        (ps: any) => ps.skill_id === skillObj.id || ps.skills?.name?.toLowerCase() === canonicalName.toLowerCase() || this.getCanonicalSkillName(ps.skills?.name || '').toLowerCase() === canonicalName.toLowerCase()
      );

      if (!alreadyAttached) {
        await this.skillService.addSkillToProject(resumeProject.id, skillObj.id);
        await this.fetchProjects();
        this.showToast(`Added "${canonicalName}" to your portfolio skills!`, 'success');
      } else {
        this.showToast(`"${canonicalName}" is already active in your portfolio.`, 'info');
      }
    } catch (err: any) {
      this.showToast(`Error adding skill: ${err.message}`, 'error');
    }
  }

  async syncAllResumeSkillsToPortfolio() {
    const skillsToSync = this.getResumeExtractedSkills();
    if (!skillsToSync || skillsToSync.length === 0) {
      this.showToast('No extracted skills available to sync.', 'warning');
      return;
    }

    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }

    this.syncingResumeSkills.set(true);

    try {
      // 1. Get or create Resume container project
      const resumeProj = await this.getOrCreateResumeProject();
      if (!resumeProj) throw new Error('Could not initialize resume portfolio record.');

      // 2. Map existing global skills
      const skillMap = new Map<string, string>();
      for (const s of this.skills()) {
        skillMap.set(s.name.toLowerCase(), s.id);
      }

      // 3. Existing project skill ids & canonical names attached
      const attachedSkillIds = new Set<string>(
        (resumeProj.project_skills || []).map((ps: any) => ps.skill_id)
      );
      const attachedSkillNames = new Set<string>(
        (resumeProj.project_skills || []).map((ps: any) => this.getCanonicalSkillName(ps.skills?.name || '').toLowerCase())
      );

      let addedCount = 0;

      for (const rawSkillName of skillsToSync) {
        const canonicalName = this.getCanonicalSkillName(rawSkillName);
        let skillId = skillMap.get(canonicalName.toLowerCase()) || skillMap.get(rawSkillName.toLowerCase());

        // Create if missing in global catalog
        if (!skillId) {
          const canonicalCat = this.classifySkillCategory(canonicalName);
          const { data: created, error } = await this.skillService.createSkill(canonicalName, canonicalCat);
          if (!error && created) {
            skillId = created.id;
            skillMap.set(canonicalName.toLowerCase(), created.id);
          }
        }

        // Attach to user's resume project if not yet attached
        if (skillId && !attachedSkillIds.has(skillId) && !attachedSkillNames.has(canonicalName.toLowerCase())) {
          const { error: attachErr } = await this.skillService.addSkillToProject(resumeProj.id, skillId);
          if (!attachErr) {
            attachedSkillIds.add(skillId);
            attachedSkillNames.add(canonicalName.toLowerCase());
            addedCount++;
          }
        }
      }

      await this.fetchSkills();
      await this.fetchProjects();

      if (addedCount > 0) {
        this.showToast(`Successfully synced ${addedCount} resume skill(s) to your developer portfolio!`, 'success');
      } else {
        this.showToast('All extracted resume skills are already active in your portfolio.', 'info');
      }
    } catch (err: any) {
      this.showToast(`Failed to sync resume skills: ${err.message}`, 'error');
    } finally {
      this.syncingResumeSkills.set(false);
    }
  }

  async importExtractedProject(proj: any) {
    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }

    const { data, error } = await this.projectService.createProject(
      proj.name,
      proj.description || 'Imported from uploaded PDF resume'
    );

    if (error) {
      this.showToast('Failed to import project: ' + error.message, 'error');
      return;
    }

    if (proj.detected_skills && data) {
      for (const skillName of proj.detected_skills) {
        const skillObj = this.skills().find(s => s.name.toLowerCase() === skillName.toLowerCase());
        if (skillObj) {
          await this.skillService.addSkillToProject(data.id, skillObj.id);
        }
      }
    }

    await this.fetchProjects();
    this.showToast(`Imported project "${proj.name}"!`, 'success');
  }

  // Portfolio Optimization Handlers (Stage 11)
  setEffortBudget(hours: number) {
    this.effortBudgetHours.set(hours);
  }

  runPortfolioOptimization() {
    this.isOptimizing.set(true);

    const userSkills = this.getUserSkillNames();
    const missingSkills = this.skillGap()?.missing_skills || [];
    const matchingSkills = this.skillGap()?.matching_skills || [];
    const targetRoleTitle = this.selectedRole()?.title || 'General Developer';

    const req = {
      user_skills: userSkills,
      missing_skills: missingSkills,
      matching_skills: matchingSkills,
      target_role: targetRoleTitle,
      existing_projects: this.projects(),
      effort_budget_hours: this.effortBudgetHours(),
      max_projects_count: 3
    };

    this.optimizationService.getRecommendations(req).subscribe({
      next: (res) => {
        this.isOptimizing.set(false);
        this.optimizationResult.set(res);
        this.activeBlueprintView.set('curated');
        if (typeof localStorage !== 'undefined' && this.selectedRoleId()) {
          localStorage.setItem(`portfolioiq_opt_cache_${this.selectedRoleId()}`, JSON.stringify(res));
        }
      },
      error: (err) => {
        this.isOptimizing.set(false);
        this.showToast('Optimization Failed: ' + (err.error?.detail || err.message), 'error');
      }
    });
  }

  generateDynamicAiBlueprint() {
    this.isGeneratingCustomBlueprint.set(true);

    const userSkills = this.getUserSkillNames();
    const missingSkills = this.skillGap()?.missing_skills || [];
    const matchingSkills = this.skillGap()?.matching_skills || [];
    const targetRoleTitle = this.selectedRole()?.title || 'General Developer';

    const req = {
      user_skills: userSkills,
      missing_skills: missingSkills,
      matching_skills: matchingSkills,
      target_role: targetRoleTitle,
      existing_projects: this.projects(),
      effort_budget_hours: this.effortBudgetHours(),
      max_projects_count: 1
    };

    this.optimizationService.generateCustomBlueprint(req).subscribe({
      next: (res) => {
        this.isGeneratingCustomBlueprint.set(false);
        this.customAiBlueprint.set(res);
        this.activeBlueprintView.set('ai_custom');
        this.showToast(`AI Coach synthesized a custom blueprint: "${res.title}"!`, 'success');
        if (typeof localStorage !== 'undefined' && this.selectedRoleId()) {
          localStorage.setItem(`portfolioiq_ai_blueprint_${this.selectedRoleId()}`, JSON.stringify(res));
        }
      },
      error: (err) => {
        this.isGeneratingCustomBlueprint.set(false);
        this.showToast('AI Blueprint Generation Failed: ' + (err.error?.detail || err.message), 'error');
      }
    });
  }

  setActiveBlueprintView(view: 'curated' | 'ai_custom') {
    this.activeBlueprintView.set(view);
  }

  getSkillPedagogicalWeight(skill: string): number {
    const s = (skill || '').toLowerCase().trim();
    // Level 1: Core Foundations, Languages & Version Control (100 - 199)
    if (s === 'git' || s === 'github') return 100;
    if (s.includes('html') || s.includes('markup')) return 110;
    if (s === 'css' || s === 'css3') return 120;
    if (s === 'javascript' || s === 'js') return 130;
    if (s === 'typescript' || s === 'ts') return 140;
    if (s === 'python') return 150;
    if (s === 'java' || s === 'c++' || s === 'c#' || s === 'go' || s === 'rust' || s === 'php') return 160;
    if (s === 'sql') return 170;
    if (s.includes('data structures') || s.includes('algorithms')) return 180;
    if (s === 'linux' || s === 'bash' || s === 'shell') return 190;

    // Level 2: UI Styling, Design & Frontend Frameworks (200 - 299)
    if (s.includes('figma') || s.includes('ui/ux') || s.includes('wirefram')) return 200;
    if (s.includes('design system')) return 210;
    if (s.includes('tailwind') || s.includes('bootstrap') || s.includes('sass') || s.includes('scss')) return 220;
    if (s.includes('responsive')) return 230;
    if (s.includes('react') || s.includes('angular') || s.includes('vue') || s.includes('svelte')) return 250;
    if (s.includes('next.js') || s.includes('nuxt')) return 260;
    if (s.includes('flutter') || s.includes('mobile')) return 270;

    // Level 3: APIs, Server-side & Backend Runtimes (300 - 399)
    if (s.includes('rest api') || s.includes('api')) return 300;
    if (s.includes('node') || s.includes('express')) return 310;
    if (s.includes('fastapi') || s.includes('flask') || s.includes('django')) return 320;
    if (s.includes('spring') || s.includes('nest') || s.includes('laravel')) return 330;
    if (s.includes('supabase') || s.includes('firebase')) return 350;

    // Level 4: Databases, Storage & Caching (400 - 499)
    if (s.includes('relational database')) return 400;
    if (s.includes('postgres') || s.includes('postgresql')) return 410;
    if (s.includes('mysql') || s.includes('sqlite')) return 420;
    if (s.includes('mongo') || s.includes('nosql')) return 430;
    if (s.includes('redis') || s.includes('cache')) return 440;
    if (s.includes('vector database') || s.includes('chroma') || s.includes('pinecone')) return 460;

    // Level 5: Testing, DevOps, Containerization & CI/CD (500 - 599)
    if (s.includes('test') || s.includes('qa') || s.includes('postman')) return 500;
    if (s.includes('docker') || s.includes('container')) return 520;
    if (s.includes('ci/cd') || s.includes('actions') || s.includes('jenkins')) return 540;
    if (s.includes('kubernetes') || s.includes('k8s')) return 560;
    if (s.includes('cloud') || s.includes('aws') || s.includes('azure') || s.includes('gcp') || s.includes('terraform')) return 580;

    // Level 6: Advanced Architecture, AI & Distributed Systems (600 - 699)
    if (s.includes('microservices') || s.includes('distributed')) return 600;
    if (s.includes('graphql') || s.includes('websocket') || s.includes('grpc')) return 610;
    if (s.includes('system design') || s.includes('architecture')) return 620;
    if (s.includes('etl') || s.includes('pipeline')) return 630;
    if (s.includes('machine learning') || s.includes('deep learning') || s.includes('ai') || s.includes('mlops') || s.includes('rag')) return 650;

    return 350;
  }

  getFullRoleRoadmapNodes(): { name: string; status: 'mastered' | 'pending'; stepLabel: string; isPriority?: boolean; levelWeight: number }[] {
    const matching = this.skillGap()?.matching_skills || [];
    const missingSequence = this.optimizationResult()?.optimal_skill_path || this.skillGap()?.missing_skills || [];
    
    // 1. Sort Acquired / Mastered skills by pedagogical hierarchy (Foundational -> Advanced)
    const sortedMatching = [...matching].sort((a, b) => this.getSkillPedagogicalWeight(a) - this.getSkillPedagogicalWeight(b));
    
    const nodes: { name: string; status: 'mastered' | 'pending'; stepLabel: string; isPriority?: boolean; levelWeight: number }[] = [];
    
    sortedMatching.forEach((skill) => {
      nodes.push({
        name: skill,
        status: 'mastered',
        stepLabel: 'Acquired',
        levelWeight: this.getSkillPedagogicalWeight(skill)
      });
    });

    // 2. Sort Target Gap Milestones by pedagogical hierarchy
    const uniqueMissing = missingSequence.filter(skill => !matching.some(m => m.toLowerCase() === skill.toLowerCase()));
    const sortedMissing = [...uniqueMissing].sort((a, b) => this.getSkillPedagogicalWeight(a) - this.getSkillPedagogicalWeight(b));

    sortedMissing.forEach((skill, idx) => {
      nodes.push({
        name: skill,
        status: 'pending',
        stepLabel: `Milestone ${idx + 1}`,
        isPriority: idx === 0,
        levelWeight: this.getSkillPedagogicalWeight(skill)
      });
    });

    return nodes;
  }

  getMasteredSkillsCount(): number {
    return this.getFullRoleRoadmapNodes().filter(n => n.status === 'mastered').length;
  }

  getTotalRoleSkillsCount(): number {
    return this.getFullRoleRoadmapNodes().length;
  }

  getRoleMasteryPercentage(): number {
    const total = this.getTotalRoleSkillsCount();
    if (total === 0) return 0;
    const mastered = this.getMasteredSkillsCount();
    return Math.round((mastered / total) * 100);
  }

  async adoptRecommendedProject(rec: RecommendedProject) {
    if (!this.currentUser()) {
      this.openAuthModal('login');
      this.showToast('Please sign in first to adopt this project into your portfolio.', 'warning');
      return;
    }

    const { data, error } = await this.projectService.createProject(
      rec.title,
      `${rec.description}\n\nArchitecture: ${rec.architecture_highlights}`
    );

    if (error) {
      this.showToast('Failed to add project: ' + error.message, 'error');
      return;
    }

    // Attach matching or created skills
    if (data && rec.skills?.length) {
      for (const skillName of rec.skills) {
        let skillObj = this.skills().find(s => s.name.toLowerCase() === skillName.toLowerCase());
        if (!skillObj) {
          // auto create skill if it does not exist
          const canonicalCat = this.classifySkillCategory(skillName, rec.domain);
          const newSkill = await this.skillService.createSkill(skillName, canonicalCat);
          if (newSkill.data) {
            skillObj = newSkill.data;
          }
        }
        if (skillObj) {
          await this.skillService.addSkillToProject(data.id, skillObj.id);
        }
      }
    }

    await this.fetchProjects();
    this.showToast(`Successfully added "${rec.title}" to your active projects! Check the Projects tab.`, 'success');
  }

  // =========================================================================
  // KNOWLEDGE GRAPH OPERATIONS (STAGE 12)
  // =========================================================================
  setKnowledgeViewMode(mode: 'tree' | 'inspector' | 'path') {
    this.knowledgeViewMode.set(mode);
    if (mode === 'inspector' && !this.inspectedNodeName()) {
      this.inspectNode('Docker');
    }
    if (mode === 'path' && !this.goalSkillRoadmap()) {
      this.calculateGoalSkillPath();
    }
  }

  loadInitialKnowledgeData() {
    const savedKnowledgeRole = typeof localStorage !== 'undefined' ? localStorage.getItem('portfolioiq_selected_knowledge_role') : null;
    const initialRole = savedKnowledgeRole || this.selectedRole()?.title || (this.careerRoles().length > 0 ? this.careerRoles()[0].title : 'AI / ML Engineer');
    this.selectRoleTree(initialRole);
    this.loadKnowledgeGraphData();
  }

  loadKnowledgeGraphData() {
    this.knowledgeService.getGraph().subscribe({
      next: (res) => {
        this.knowledgeGraphData.set(res);
        if (!this.inspectedNodeName() && res?.nodes?.length) {
          const defaultNode = res.nodes.find(n => n.id === 'Docker') || res.nodes[0];
          this.inspectNode(defaultNode.id);
        }
      },
      error: (err) => console.warn('Knowledge graph load failed:', err)
    });
  }

  selectRoleTree(roleTitle: string) {
    if (!roleTitle) return;
    this.selectedKnowledgeRole.set(roleTitle);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('portfolioiq_selected_knowledge_role', roleTitle);
    }
    this.isLoadingKnowledge.set(true);

    this.knowledgeService.getRoleTree(roleTitle).subscribe({
      next: (res) => {
        this.isLoadingKnowledge.set(false);
        this.roleSkillTree.set(res);
      },
      error: (err) => {
        this.isLoadingKnowledge.set(false);
        console.error('Failed to load role tree:', err);
      }
    });
  }

  inspectNode(nodeName: string) {
    if (!nodeName) return;
    this.inspectedNodeName.set(nodeName);
    this.inspectedNodePrereqs.set([]);
    this.inspectedNodeUnlocked.set([]);
    this.inspectedNodeComplements.set([]);

    // Fetch prerequisites
    this.knowledgeService.getPrerequisites(nodeName).subscribe({
      next: (res) => this.inspectedNodePrereqs.set(res.prerequisites || [])
    });

    // Fetch unlocked skills
    this.knowledgeService.getUnlockedSkills(nodeName).subscribe({
      next: (res) => this.inspectedNodeUnlocked.set(res.unlocked_skills || [])
    });

    // Fetch complementary tech
    this.knowledgeService.getComplements(nodeName).subscribe({
      next: (res) => this.inspectedNodeComplements.set(res.complements || [])
    });
  }

  closeNodeInspector() {
    this.inspectedNodeName.set('');
    this.inspectedNodePrereqs.set([]);
    this.inspectedNodeUnlocked.set([]);
    this.inspectedNodeComplements.set([]);
  }

  calculateGoalSkillPath(goalSkill?: string) {
    const target = goalSkill || this.goalSkillInput() || 'Kubernetes';
    this.goalSkillInput.set(target);
    this.isEvaluatingLearningPath.set(true);

    const userSkills = this.getUserSkillNames();
    this.knowledgeService.getLearningPath(target, userSkills).subscribe({
      next: (res) => {
        this.goalSkillRoadmap.set(res);
        this.isEvaluatingLearningPath.set(false);
      },
      error: (err) => {
        this.isEvaluatingLearningPath.set(false);
        console.error('Learning path calculation failed:', err);
      }
    });
  }

  // AI Coach Operations (Stage 13)
  loadCoachStatus() {
    this.coachService.getStatus().subscribe({
      next: (status) => this.coachStatus.set(status),
      error: () => this.coachStatus.set({
        live: false,
        model: 'Offline',
        provider: 'Local Engine',
        message: 'Backend AI module offline'
      })
    });
  }

  buildPortfolioContext(): PortfolioContext {
    const role = this.selectedRole();
    const score = this.portfolioScore();
    const gap = this.skillGap();
    const currentProjects = this.projects().map(p => ({
      name: p.title || p.name,
      category: p.category || 'General',
      skills: (p.project_skills || []).map((ps: any) => ps.skills?.name).filter(Boolean)
    }));
    const userSkillNames = this.skills().map(s => s.name);
    const resumeSkills = this.getResumeExtractedSkills();
    const combinedSkills = Array.from(new Set([...userSkillNames, ...resumeSkills]));

    const resumeProjects = this.getResumeExtractedProjects();
    const projectsToPass = currentProjects.length > 0
      ? currentProjects
      : (resumeProjects.length > 0 ? resumeProjects.map((p: any) => ({ name: p.name || 'Project', category: 'Project', skills: p.detected_skills || [] })) : []);

    return {
      target_role: role?.title || this.currentUser()?.target_role || 'Software Engineer',
      match_score: gap?.match_percentage || 0,
      health_score: score?.overall_health_score || 0,
      missing_skills: gap?.missing_skills || [],
      acquired_skills: combinedSkills.length > 0 ? combinedSkills : userSkillNames,
      pillars: {
        completeness: score?.metrics?.project_volume_score || 0,
        tech_stack: score?.metrics?.skill_diversity_score || 0,
        quality: score?.metrics?.detail_quality_score || 0,
        diversity: score?.metrics?.activity_status_score || 0
      },
      projects: projectsToPass
    };
  }

  onCoachScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target) {
      this.coachScrollTop = target.scrollTop;
    }
  }

  restoreCoachScrollPosition() {
    setTimeout(() => {
      const el = this.chatStreamRef?.nativeElement || (document.querySelector('.chat-message-stream') as HTMLDivElement);
      if (el) {
        if (this.coachScrollTop >= 0) {
          el.scrollTop = this.coachScrollTop;
        } else {
          el.scrollTop = el.scrollHeight;
        }
      }
    }, 40);
  }

  scrollCoachToBottom(smooth = true) {
    setTimeout(() => {
      const el = this.chatStreamRef?.nativeElement || (document.querySelector('.chat-message-stream') as HTMLDivElement);
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
        this.coachScrollTop = el.scrollHeight;
      }
    }, 60);
  }

  scrollCoachToTop(smooth = true) {
    setTimeout(() => {
      const el = this.chatStreamRef?.nativeElement || (document.querySelector('.chat-message-stream') as HTMLDivElement);
      if (el) {
        el.scrollTo({
          top: 0,
          behavior: smooth ? 'smooth' : 'auto'
        });
        this.coachScrollTop = 0;
      }
    }, 20);
  }

  async loadCoachMessages() {
    const messages = await this.coachService.loadMessagesFromCloud();
    if (messages && messages.length > 0) {
      this.coachMessages.set(messages);
      this.scrollCoachToBottom(false);
    }
  }

  sendCoachMessage(overrideMessage?: string) {
    const text = (overrideMessage || this.coachInput).trim();
    if (!text || this.coachLoading()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: time };

    this.coachMessages.update(msgs => [...msgs, userMsg]);
    this.coachService.saveMessageToCloud(userMsg);
    this.scrollCoachToBottom(true);

    if (!overrideMessage) {
      this.coachInput = '';
    }
    this.coachLoading.set(true);

    const context = this.buildPortfolioContext();
    this.coachService.sendMessage(this.coachMessages(), context).subscribe({
      next: (res) => {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: res.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDemo: res.is_demo
        };
        this.coachMessages.update(msgs => [...msgs, assistantMsg]);
        this.coachService.saveMessageToCloud(assistantMsg);

        if (res.suggested_followups?.length) {
          this.suggestedFollowups.set(res.suggested_followups);
        }
        this.coachLoading.set(false);
        this.scrollCoachToBottom(true);
      },
      error: (err) => {
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `Failed to reach AI Coach: ${err.message || 'Connection error'}. Please check if the backend is running.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.coachMessages.update(msgs => [...msgs, errorMsg]);
        this.coachService.saveMessageToCloud(errorMsg);
        this.coachLoading.set(false);
        this.scrollCoachToBottom(true);
      }
    });
  }

  sendQuickPrompt(promptText: string) {
    this.sendCoachMessage(promptText);
  }

  requestExecutiveCritique() {
    this.sendCoachMessage("Please provide an executive critique and architectural review of my developer portfolio.");
  }

  requestProjectRecommendations() {
    this.sendCoachMessage("Recommend 3 high-impact project blueprints tailored to fill my biggest skill gaps.");
  }

  clearCoachChat() {
    this.openConfirmDialog({
      title: 'Clear AI Coach Chat',
      message: 'Are you sure you want to reset and clear your conversation history with the AI Coach?',
      confirmText: 'Clear Chat',
      cancelText: 'Keep Chat',
      type: 'danger',
      icon: 'warning',
      onConfirm: async () => {
        await this.coachService.clearMessagesFromCloud();
        this.coachMessages.set([
          {
            role: 'assistant',
            content: "Chat cleared! How can I help you elevate your developer portfolio today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        this.showToast('AI Coach conversation cleared.', 'info');
      }
    });
  }

  @HostListener('click', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const copyBtn = target?.closest('.copy-code-btn') as HTMLButtonElement | null;
    if (copyBtn) {
      event.preventDefault();
      event.stopPropagation();
      const codeBlock = copyBtn.closest('.chat-code-block');
      const codeEl = codeBlock?.querySelector('pre code');
      if (codeEl) {
        const textToCopy = codeEl.textContent || '';
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalHtml = copyBtn.innerHTML;
          copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>`;
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
            copyBtn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          this.showToast('Copied to clipboard', 'info');
        });
      }
    }
  }

  formatCoachMarkdown(rawText: string): SafeHtml {
    if (!rawText) return '';

    let text = rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Helper for inline markdown elements
    const parseInline = (str: string): string => {
      let s = str;
      // Inline code: `code`
      s = s.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
      // Bold + Italic: ***text***
      s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
      // Bold: **text** or __text__
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
      // Italic: *text* or _text_
      s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
      return s;
    };

    const blocks: string[] = [];

    // 1. Extract Code Blocks into isolated placeholders (both closed and unclosed)
    text = text.replace(/```([\w-]*)[ \t]*\r?\n([\s\S]*?)(?:```|$)/g, (_m, lang, code) => {
      if (!code.trim() && !_m.includes('\n')) return _m;
      const displayLang = (lang || 'code').trim();
      const headerHtml = `<div class="chat-code-header"><span class="code-lang-tag">${displayLang}</span><button class="copy-code-btn" type="button" title="Copy code snippet"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span></button></div>`;
      const formatted = `<div class="chat-code-block">${headerHtml}<pre><code>${code.trim()}</code></pre></div>`;
      blocks.push(formatted);
      return `%%%PIQBLOCK${blocks.length - 1}%%%`;
    });

    // 2. Extract and Parse Tables into isolated placeholders
    text = text.replace(/((?:^[ \t]*\|?[^\n\r|]+\|[^\n\r]*\|?[ \t]*(?:\r?\n|$)){2,})/gm, (tableMatch) => {
      const rawLines = tableMatch.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (rawLines.length < 2) return tableMatch;

      // Find separator index
      const sepIndex = rawLines.findIndex(l => /^[ \t]*\|?([ \t]*:?-{2,}:?[ \t]*\|)+([ \t]*:?-{2,}:?[ \t]*)?\|?[ \t]*$/.test(l));

      let tableHtml = '<div class="chat-table-wrapper"><table class="chat-table">';
      let isHeader = true;

      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        if (i === sepIndex || /^[ \t]*\|?([ \t]*:?-{2,}:?[ \t]*\|)+([ \t]*:?-{2,}:?[ \t]*)?\|?[ \t]*$/.test(line)) {
          isHeader = false;
          continue;
        }

        const clean = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');
        const cells = clean.split('|').map(c => {
          let cell = c.trim();
          cell = cell.replace(/&lt;br\s*\/?&gt;/gi, '<br/>');
          return parseInline(cell);
        });

        if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;

        if (isHeader && i < (sepIndex !== -1 ? sepIndex : 1)) {
          tableHtml += '<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
          if (sepIndex === -1) isHeader = false;
        } else {
          tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
      }

      tableHtml += '</tbody></table></div>';
      blocks.push(tableHtml);
      return `%%%PIQBLOCK${blocks.length - 1}%%%`;
    });

    // 3. Process Blockquotes
    text = text.replace(/^>\s?(.*$)/gim, '<blockquote class="chat-blockquote">$1</blockquote>');

    // 4. Horizontal Rules
    text = text.replace(/^\s*(?:---+|\*\*\*+|___+)\s*$/gm, '<hr class="chat-hr"/>');

    // 4b. Ensure generous separation and convert ANY numbered section headers (e.g., "1. Title", "**1. Title**", "***1. Title***")
    // into dedicated block headers with clear spacing
    text = text.replace(/^[ \t]*[*_#]*[ \t]*(\d+\.)[ \t]+([^\n\r]+?)[ \t]*$/gm, (_m, num, content) => {
      const clean = content.replace(/^[*_]+|[*_]+$/g, '').trim();
      return `\n\n<div class="chat-numbered-heading"><span class="num-badge">${num}</span> ${parseInline(clean)}</div>\n\n`;
    });

    // Highlight STAR format labels if present on a line (Situation:, Task:, Action:, Result:)
    text = text.replace(/^[ \t]*(Situation|Task|Action|Result):[ \t]*/gim, '<strong class="star-label">$1:</strong> ');

    // 5. Headers (from h6 down to h1)
    text = text.replace(/^###### (.*$)/gim, '<h6 class="chat-h6">$1</h6>');
    text = text.replace(/^##### (.*$)/gim, '<h5 class="chat-h5">$1</h5>');
    text = text.replace(/^#### (.*$)/gim, '<h4 class="chat-h4">$1</h4>');
    text = text.replace(/^### (.*$)/gim, '<h4 class="chat-h4">$1</h4>');
    text = text.replace(/^## (.*$)/gim, '<h3 class="chat-h3">$1</h3>');
    text = text.replace(/^# (.*$)/gim, '<h2 class="chat-h2">$1</h2>');

    // 6. Inline formatting on general text
    text = parseInline(text);

    // 7. Unordered lists
    text = text.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="chat-li">$1</li>');
    text = text.replace(/((?:<li class="chat-li">.*?<\/li>(?:\r?\n|<br\/>)?)+)/g, '<ul class="chat-ul">$1</ul>');

    // 8. Numbered lists (for any remaining standard list items)
    text = text.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="chat-oli">$1</li>');
    text = text.replace(/((?:<li class="chat-oli">.*?<\/li>(?:\r?\n|<br\/>)?)+)/g, '<ol class="chat-ol">$1</ol>');

    // 9. Paragraphs and line breaks
    text = text.replace(/\r?\n\r?\n+/g, '<div class="chat-paragraph-gap"></div>');
    text = text.replace(/\r?\n/g, '<br/>');

    // Clean up unnecessary <br/> right before or after numbered headings
    text = text.replace(/(?:<br\/>|<div class="chat-paragraph-gap"><\/div>)+\s*(<div class="chat-numbered-heading">)/g, '$1');
    text = text.replace(/(<\/div>)\s*(?:<br\/>|<div class="chat-paragraph-gap"><\/div>)+/g, '$1<div class="chat-paragraph-gap"></div>');

    // 10. Restore extracted Code Blocks and Tables cleanly
    text = text.replace(/%%%PIQBLOCK(\d+)%%%/g, (_m, idx) => {
      return blocks[Number(idx)] || '';
    });

    return this.sanitizer.bypassSecurityTrustHtml(text);
  }

  // GitHub Integration Handlers (Stage 14)
  loadGitHubStatus() {
    this.githubService.getStatus().subscribe({
      next: (status) => this.githubStatus.set(status),
      error: () => this.githubStatus.set({ authenticated: false, status: 'offline' })
    });
  }

  scanGitHub(username?: string) {
    const raw = (username || this.githubUsername || '').trim();
    // Strip URL prefixes (https://github.com/), github.com/, leading @, and whitespace
    const user = raw.replace(/^https?:\/\/github\.com\//i, '').replace(/^github\.com\//i, '').replace(/^@+/, '').trim();
    if (!user || this.isScanningGitHub()) return;
    this.githubUsername = user;
    this.isScanningGitHub.set(true);
    this.githubError.set('');
    this.githubImportSuccessMsg.set('');

    this.githubService.scanUser(user).subscribe({
      next: (res) => {
        this.githubScanData.set(res);
        this.isScanningGitHub.set(false);
        this.loadGitHubStatus();
      },
      error: (err) => {
        this.githubError.set(err.error?.detail || err.message || 'Failed to scan GitHub profile.');
        this.isScanningGitHub.set(false);
      }
    });
  }

  devBypassActive = signal<boolean>(localStorage.getItem('portfolioiq_dev_oauth_bypass') === 'true');

  toggleDevOAuthBypass() {
    const next = !this.devBypassActive();
    this.devBypassActive.set(next);
    localStorage.setItem('portfolioiq_dev_oauth_bypass', String(next));
    if (next) {
      const username = this.linkedGitHubUsername();
      if (username) {
        this.verifiedGitHubUsername.set(username);
        this.isGitHubOAuthVerified.set(true);
        this.showToast(`[Dev Mode] Simulated GitHub OAuth verified for @${username}`, 'success');
      } else {
        this.showToast('[Dev Mode] Please enter or link a GitHub username first.', 'warning');
      }
    } else {
      this.checkOAuthGitHubIdentity(this.currentUser());
      this.showToast('[Dev Mode] Real OAuth enforcement active.', 'info');
    }
  }

  isScannedAccountLinked(): boolean {
    const scanned = this.githubScanData()?.profile?.username?.trim().toLowerCase();
    if (!scanned) return false;

    // If OAuth is verified, strict match with cryptographically verified username
    if (this.isGitHubOAuthVerified() && this.verifiedGitHubUsername()) {
      return scanned === this.verifiedGitHubUsername()?.trim().toLowerCase();
    }

    // Unverified fallback: match against linked account
    const linked = this.linkedGitHubUsername()?.trim().toLowerCase();
    return !!linked && scanned === linked;
  }

  startEditingLinkedGitHub() {
    this.tempLinkedUsername = this.linkedGitHubUsername();
    this.isEditingLinkedGitHub.set(true);
  }

  saveLinkedGitHubUsername() {
    const trimmed = this.tempLinkedUsername.trim();
    if (trimmed) {
      this.linkedGitHubUsername.set(trimmed);
      const user = this.currentUser();
      if (user?.id) {
        localStorage.setItem(`portfolioiq_github_${user.id}`, trimmed);
      }
      this.isEditingLinkedGitHub.set(false);
      this.scanGitHub(trimmed);
    }
  }

  cancelEditingLinkedGitHub() {
    this.isEditingLinkedGitHub.set(false);
  }

  setRepoImportStatus(repoId: string, status: 'completed' | 'active' | 'idea') {
    this.repoImportStatuses.update(map => ({
      ...map,
      [repoId]: status
    }));
  }

  getRepoImportStatus(repoId: string): 'completed' | 'active' | 'idea' {
    return this.repoImportStatuses()[repoId] || 'completed';
  }

  openImportRepoModal(repo: GitHubRepository) {
    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }

    if (!this.isGitHubOAuthVerified()) {
      this.githubError.set(
        `OAuth Verification Required: To prevent unauthorized imports and prove you own this repository, please verify via GitHub OAuth before importing.`
      );
      this.showToast('Please connect your GitHub account via OAuth to verify ownership.', 'warning');
      return;
    }

    if (!this.isScannedAccountLinked()) {
      this.githubError.set(
        `Import Restricted: You are authenticated as @${this.verifiedGitHubUsername()}. You cannot import repositories owned by @${this.githubScanData()?.profile?.username}.`
      );
      return;
    }

    this.importModalRepo.set(repo);
    this.importModalName = repo.name || '';
    const cleanDesc = repo.description ? repo.description.trim() : '';
    this.importModalDesc = cleanDesc 
      ? `${cleanDesc} (Imported from GitHub: ${repo.html_url})` 
      : `Imported from GitHub: ${repo.html_url}`;
    this.importModalStatus = this.getRepoImportStatus(repo.id) || 'completed';
    this.isImportingModal.set(false);
  }

  closeImportRepoModal() {
    this.importModalRepo.set(null);
    this.importModalName = '';
    this.importModalDesc = '';
    this.isImportingModal.set(false);
  }

  async confirmImportRepo() {
    const repo = this.importModalRepo();
    if (!repo) return;

    const trimmedName = this.importModalName.trim();
    if (!trimmedName) {
      this.showToast('Project title cannot be empty.', 'warning');
      return;
    }

    this.isImportingModal.set(true);
    await this.importRepoToPortfolio(repo, this.importModalStatus, trimmedName, this.importModalDesc.trim());
    this.isImportingModal.set(false);
    this.closeImportRepoModal();
  }

  openBatchImportModal() {
    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }

    if (!this.isGitHubOAuthVerified()) {
      this.githubError.set(
        `OAuth Verification Required: To prevent unauthorized imports and prove you own these repositories, please verify via GitHub OAuth before importing.`
      );
      this.showToast('Please connect your GitHub account via OAuth to verify ownership.', 'warning');
      return;
    }

    if (!this.isScannedAccountLinked()) {
      this.githubError.set(
        `Import Restricted: You are authenticated as @${this.verifiedGitHubUsername()}. You cannot import repositories owned by @${this.githubScanData()?.profile?.username}.`
      );
      return;
    }

    if (this.githubNotImportedCount() === 0) {
      this.showToast('All scanned repositories are already in your portfolio!', 'info');
      return;
    }

    this.batchImportStatus = 'completed';
    this.batchImportModalOpen.set(true);
  }

  closeBatchImportModal() {
    this.batchImportModalOpen.set(false);
    this.isBatchImporting.set(false);
  }

  async confirmBatchImport() {
    const data = this.githubScanData();
    if (!data || !data.repos || data.repos.length === 0) return;

    const unimported = data.repos.filter(r => !this.isRepoAlreadyImported(r.name));
    if (unimported.length === 0) {
      this.showToast('All scanned repositories are already imported!', 'info');
      this.closeBatchImportModal();
      return;
    }

    this.isBatchImporting.set(true);
    const targetStatus = this.batchImportStatus;
    const statusLabel = targetStatus === 'completed' ? 'Completed' : (targetStatus === 'active' ? 'In Progress' : 'Idea');

    this.githubImportSuccessMsg.set(`Importing ${unimported.length} repositories as ${statusLabel}...`);
    let count = 0;
    for (const repo of unimported) {
      try {
        await this.importRepoToPortfolio(repo, targetStatus);
        count++;
      } catch (e) {
        console.warn('Batch import error for', repo.name, e);
      }
    }
    await this.fetchSkills();
    await this.fetchProjects();
    this.isBatchImporting.set(false);
    this.closeBatchImportModal();
    this.githubImportSuccessMsg.set(`Batch import complete! Added ${count} new repositories as ${statusLabel} to your portfolio.`);
    this.showToast(`Successfully imported ${count} repositories (${statusLabel})!`, 'success');
  }

  async importRepoToPortfolio(
    repo: GitHubRepository,
    statusOverride?: 'completed' | 'active' | 'idea',
    nameOverride?: string,
    descOverride?: string
  ) {
    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }

    // Option 3 Security Check: Require GitHub OAuth verification to import
    if (!this.isGitHubOAuthVerified()) {
      this.githubError.set(
        `OAuth Verification Required: To prevent unauthorized imports and prove you own this repository, please verify via GitHub OAuth before importing.`
      );
      this.showToast('Please connect your GitHub account via OAuth to verify ownership.', 'warning');
      return;
    }

    if (!this.isScannedAccountLinked()) {
      this.githubError.set(
        `Import Restricted: You are authenticated as @${this.verifiedGitHubUsername()}. You cannot import repositories owned by @${this.githubScanData()?.profile?.username}.`
      );
      return;
    }

    this.importingRepoId.set(repo.id);
    this.githubError.set('');
    this.githubImportSuccessMsg.set('');

    try {
      const projectName = (nameOverride && nameOverride.trim()) || repo.name;
      const description = descOverride !== undefined 
        ? descOverride 
        : (repo.description 
          ? `${repo.description} (Imported from GitHub: ${repo.html_url})` 
          : `Imported from GitHub: ${repo.html_url}`);

      const targetStatus = statusOverride || this.getRepoImportStatus(repo.id);

      const { data: newProject, error: projErr } = await this.projectService.createProject(
        projectName,
        description,
        targetStatus
      );
      if (projErr || !newProject) throw projErr || new Error('Failed to create project in portfolio.');

      // Match or create skills and link them
      const existingSkillMap = new Map<string, string>(
        this.skills().map(s => [s.name.toLowerCase(), s.id])
      );
      for (const skillName of (repo.detected_skills || [])) {
        let skillId = existingSkillMap.get(skillName.toLowerCase());
        if (!skillId) {
          try {
            const canonicalCat = this.classifySkillCategory(skillName);
            const { data: newSkill } = await this.skillService.createSkill(skillName, canonicalCat);
            if (newSkill && (newSkill as any).id) {
              const createdId = String((newSkill as any).id);
              skillId = createdId;
              existingSkillMap.set(skillName.toLowerCase(), createdId);
            }
          } catch (e) {
            console.warn('Skill create warning:', skillName, e);
          }
        }
        if (skillId) {
          try {
            await this.skillService.addSkillToProject(newProject.id, skillId);
          } catch (e) {
            console.warn('Skill attach warning:', skillName, e);
          }
        }
      }

      await this.fetchSkills();
      await this.fetchProjects();

      const statusLabel = targetStatus === 'completed' ? 'Completed' : (targetStatus === 'active' ? 'In Progress' : 'Idea');
      this.githubImportSuccessMsg.set(`Successfully imported "${projectName}" as ${statusLabel} with ${repo.detected_skills?.length || 0} skills into your portfolio!`);
      this.showToast(`Imported ${projectName} (${statusLabel})!`, 'success');
    } catch (err: any) {
      console.error('Import repo error:', err);
      this.githubError.set(err.message || 'Import failed.');
    } finally {
      this.importingRepoId.set(null);
    }
  }

  isRepoAlreadyImported(repoName: string): boolean {
    return this.projects().some(p => p.name.toLowerCase() === repoName.toLowerCase());
  }

  async importAllScannedRepos() {
    this.openBatchImportModal();
  }

  // GitHub UI Polish Helpers
  getLanguageColor(lang: string): string {
    const l = (lang || '').toLowerCase().trim();
    const colors: { [key: string]: string } = {
      'typescript': '#3178c6',
      'javascript': '#f7df1e',
      'python': '#3572A5',
      'dart': '#00B4AB',
      'flutter': '#02569B',
      'java': '#b07219',
      'html': '#e34c26',
      'html/css': '#e34c26',
      'css': '#563d7c',
      'c++': '#f34b7d',
      'c#': '#178600',
      'c': '#555555',
      'go': '#00ADD8',
      'rust': '#dea584',
      'php': '#4F5D95',
      'ruby': '#701516',
      'swift': '#F05138',
      'kotlin': '#A97BFF',
      'shell': '#89e051',
      'bash': '#89e051',
      'vue': '#41b883',
      'jupyter notebook': '#DA5B0B'
    };
    return colors[l] || '#6366f1';
  }

  getGitHubLanguageSegments(): { name: string; count: number; percentage: number; color: string }[] {
    const dist = this.githubScanData()?.summary?.language_distribution;
    if (!dist) return [];

    const totalLangRepos = Object.values(dist).reduce((acc, val) => acc + (Number(val) || 0), 0) || 1;

    const segments = Object.entries(dist).map(([name, count]) => {
      const num = Number(count) || 0;
      const percentage = Math.round((num / totalLangRepos) * 100);
      return {
        name,
        count: num,
        percentage,
        color: this.getLanguageColor(name)
      };
    });

    // Sort highest percentage first
    return segments.sort((a, b) => b.count - a.count);
  }

  getEcosystemFocus(): string {
    const segments = this.getGitHubLanguageSegments();
    if (!segments.length) return 'General Software';
    const names = segments.map(s => s.name.toLowerCase());
    if (names.includes('dart') || names.includes('flutter') || names.includes('swift') || names.includes('kotlin')) {
      if (names.includes('typescript') || names.includes('javascript')) {
        return 'Full-Stack & Mobile';
      }
      return 'Mobile Engineering';
    }
    if (names.includes('python') && (names.includes('jupyter notebook') || names.includes('c++'))) {
      return 'AI & Data Science';
    }
    if (names.includes('typescript') || names.includes('javascript') || names.includes('html') || names.includes('css')) {
      return 'Full-Stack Web Dev';
    }
    return 'Multi-Platform Dev';
  }

  getDeduplicatedRepoSkills(repo: any): string[] {
    if (!repo) return [];
    const mainLang = (repo.language || '').toLowerCase().trim();
    const skills = repo.detected_skills || [];
    const seen = new Set<string>();
    const result: string[] = [];

    for (const s of skills) {
      const sLower = s.toLowerCase().trim();
      if (sLower === mainLang) continue; // Skip if already shown as primary language pill
      if (!seen.has(sLower)) {
        seen.add(sLower);
        result.push(s);
      }
    }
    return result;
  }

  filteredGitHubRepos(): any[] {
    const repos = this.githubScanData()?.repos || [];
    const query = this.githubRepoSearchQuery().toLowerCase().trim();
    const filter = this.githubRepoFilter();
    const domain = this.githubRepoDomainFilter();

    return repos.filter(repo => {
      // 1. Text Search Query
      if (query) {
        const matchName = (repo.name || '').toLowerCase().includes(query);
        const matchDesc = (repo.description || '').toLowerCase().includes(query);
        const matchLang = (repo.language || '').toLowerCase().includes(query);
        const matchSkills = (repo.detected_skills || []).some((s: string) => s.toLowerCase().includes(query));
        if (!matchName && !matchDesc && !matchLang && !matchSkills) return false;
      }

      // 2. Status Filter
      if (filter === 'imported' && !this.isRepoAlreadyImported(repo.name)) return false;
      if (filter === 'not_imported' && this.isRepoAlreadyImported(repo.name)) return false;

      // 3. Domain Filter
      if (domain !== 'all' && (repo.predicted_category || '').toLowerCase() !== domain.toLowerCase()) return false;

      return true;
    });
  }

  getGitHubDomainList(): string[] {
    const repos = this.githubScanData()?.repos || [];
    const domains = new Set<string>();
    for (const r of repos) {
      if (r.predicted_category) domains.add(r.predicted_category);
    }
    return Array.from(domains);
  }

  githubNotImportedCount(): number {
    const repos = this.githubScanData()?.repos || [];
    return repos.filter(r => !this.isRepoAlreadyImported(r.name)).length;
  }

  githubImportedCount(): number {
    const repos = this.githubScanData()?.repos || [];
    return repos.filter(r => this.isRepoAlreadyImported(r.name)).length;
  }

  // Stage 15: System Telemetry, Toasts, and Export Handlers
  showToast(
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info', 
    durationMs = 3800,
    actionLabel?: string,
    onAction?: () => void
  ) {
    const id = ++this.toastCounter;
    this.toasts.update(current => [...current, { id, message, type, actionLabel, onAction }]);
    setTimeout(() => {
      this.dismissToast(id);
    }, durationMs);
  }

  dismissToast(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  fetchSystemTelemetry() {
    this.isLoadingTelemetry.set(true);
    this.systemService.getSystemStatus().subscribe({
      next: (res) => {
        this.systemTelemetry.set(res);
        this.isLoadingTelemetry.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch system telemetry:', err);
        this.isLoadingTelemetry.set(false);
      }
    });
  }

  openTelemetryModal() {
    this.fetchSystemTelemetry();
    this.showTelemetryModal.set(true);
  }

  closeTelemetryModal() {
    this.showTelemetryModal.set(false);
  }

  exportPortfolioPdf() {
    window.print();
  }
}



