import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  type: 'danger' | 'warning' | 'primary';
  icon: 'logout' | 'delete' | 'warning' | 'info';
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

  // Form Inputs
  authEmail = '';
  authPassword = '';
  authDisplayName = '';
  
  newProjectName = '';
  newProjectDesc = '';
  newProjectStatus = 'active';
  showAddProjectForm = signal<boolean>(false);
  projectSearchQuery = signal<string>('');
  projectStatusFilter = signal<'all' | 'active' | 'completed' | 'idea'>('all');
  
  newSkillName = '';
  newSkillCategory = 'Programming Language';
  skillsSubView = signal<'my-skills' | 'catalog'>('my-skills');

  // Resume Parser Operations
  resumeParsing = signal<boolean>(false);
  resumeData = signal<any>(null);
  syncingResumeSkills = signal<boolean>(false);
  savedResumeMeta = signal<{ fileName: string; uploadedAt: string; dataUrl?: string | null; extractedSkillsCount?: number } | null>(null);
  showResumeModal = signal<boolean>(false);
  resumePdfUrlSafe = signal<SafeResourceUrl | null>(null);
  isSavingResume = signal<boolean>(false);

  // Portfolio Optimization Operations (Stage 11)
  optimizationResult = signal<OptimizationResponse | null>(null);
  isOptimizing = signal<boolean>(false);
  effortBudgetHours = signal<number>(80);

  // Knowledge Graph & Representation Operations (Stage 12)
  knowledgeGraphData = signal<KnowledgeGraphData | null>(null);
  selectedKnowledgeRole = signal<string>('AI Engineer');
  roleSkillTree = signal<RoleSkillTreeResponse | null>(null);
  inspectedNodeName = signal<string>('');
  inspectedNodePrereqs = signal<any[]>([]);
  inspectedNodeUnlocked = signal<any[]>([]);
  inspectedNodeComplements = signal<any[]>([]);
  goalSkillInput = signal<string>('Kubernetes');
  goalSkillRoadmap = signal<LearningPathResponse | null>(null);
  isLoadingKnowledge = signal<boolean>(false);
  knowledgeViewMode = signal<'tree' | 'inspector' | 'path'>('tree');

  // Groq AI Developer Coach Operations (Stage 13)
  coachMessages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content: "👋 Hello! I'm your **PortfolioIQ AI Developer Coach** powered by Groq Llama-3.\n\nI have real-time access to your portfolio health score, verified skills, active projects, and Knowledge Graph roadmaps. Ask me anything: how to improve your projects, what skills to prioritize next, or how to break into your target role!",
      timestamp: 'Just now'
    }
  ]);
  coachLoading = signal<boolean>(false);
  coachInput = '';
  coachStatus = signal<CoachStatus | null>(null);
  suggestedFollowups = signal<string[]>([
    '📊 Critique my developer portfolio',
    '💡 Suggest 3 projects for my skill gaps',
    '⚡ What should I learn next?'
  ]);

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

  // System Diagnostics & Toast Notifications (Stage 15)
  systemTelemetry = signal<SystemTelemetryResponse | null>(null);
  showTelemetryModal = signal<boolean>(false);
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
    private sanitizer: DomSanitizer
  ) {}

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
    this.loadGitHubStatus();
    this.fetchSystemTelemetry();
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
    type?: 'danger' | 'warning' | 'primary';
    icon?: 'logout' | 'delete' | 'warning' | 'info';
    onConfirm: () => void;
  }) {
    this.confirmDialog.set({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'danger',
      icon: options.icon || (options.type === 'primary' ? 'info' : 'delete'),
      onConfirm: options.onConfirm
    });
  }

  closeConfirmDialog() {
    this.confirmDialog.update(s => ({ ...s, isOpen: false }));
  }

  handleConfirmDialogAction() {
    const action = this.confirmDialog().onConfirm;
    this.closeConfirmDialog();
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
    this.activeTab.set(tabName);
    this.closeMobileSidebar();
    if (tabName === 'github') {
      this.loadGitHubStatus();
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
    this.currentUser.set(user);
    this.checkOAuthGitHubIdentity(user);
    this.loadCloudResume(user);
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
  }

  switchAuthMode(mode: 'login' | 'register' | 'forgot') {
    this.authMode.set(mode);
    this.authError.set('');
    this.forgotSuccessMsg.set('');
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
  }

  toggleOtpInput(show: boolean) {
    this.showOtpInput.set(show);
  }

  setForgotStep(step: 1 | 2 | 3) {
    this.forgotStep.set(step);
    this.authError.set('');
    this.showOtpInput.set(false);
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
    if (!token || token.length < 6) {
      this.authError.set('Please enter the valid 6-digit verification code.');
      return;
    }

    this.authError.set('');
    this.forgotLoading.set(true);
    try {
      const { error } = await this.authService.verifyRecoveryOtp(email, token);
      if (error) {
        this.authError.set(error.message);
      } else {
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
    if (this.forgotLoading()) return;
    const email = this.forgotEmail.trim();
    if (!email) return;

    this.authError.set('');
    this.forgotLoading.set(true);
    try {
      const { error } = await this.authService.resetPasswordForEmail(email);
      if (error) {
        this.authError.set(error.message);
      } else {
        this.forgotSuccessMsg.set('A new reset link has been sent to your email.');
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
        this.forgotSuccessMsg.set('Password updated successfully! Logging you in...');
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        await this.loadCurrentUser();
        if (this.currentUser()) {
          await this.fetchProjects();
        }
        setTimeout(() => {
          this.closeAuthModal();
        }, 1200);
      }
    } catch (err: any) {
      this.authError.set(err.message || 'Failed to update password.');
    } finally {
      this.forgotLoading.set(false);
    }
  }

  setupAuthRecoveryListener() {
    // 1. Listen for Supabase auth state change events
    this.authService.onAuthStateChange(async (event, session) => {
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
      } else if (event === 'PASSWORD_RECOVERY') {
        this.currentUser.set(session?.user ?? null);
        this.authMode.set('forgot');
        this.forgotStep.set(3);
        this.forgotSuccessMsg.set('Recovery link verified! Please enter your new password below.');
        this.authError.set('');
        this.showAuthModal.set(true);
      }
    });

    // 2. Direct check on initial URL for OAuth redirect tokens or recovery
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
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
      } else if (hash.includes('type=recovery')) {
        setTimeout(async () => {
          await this.loadCurrentUser();
          this.authMode.set('forgot');
          this.forgotStep.set(3);
          this.forgotSuccessMsg.set('Recovery link verified! Please enter your new password below.');
          this.authError.set('');
          this.showAuthModal.set(true);
        }, 300);
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
    this.authError.set('');
    const { data, error } = await this.authService.signIn(this.authEmail, this.authPassword);
    if (error) {
      this.authError.set(error.message);
    } else {
      this.closeAuthModal();
      this.showToast('Welcome back! Signed in successfully.', 'success');
      await this.loadCurrentUser();
      await this.fetchProjects();
    }
  }


  async logout() {
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
    localStorage.removeItem('portfolioiq_dev_oauth_bypass');
    this.githubUsername = '';
    this.githubScanData.set(null);
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
    this.showToast('You have been signed out.', 'info');
  }

  // Skills Operations
  async fetchSkills() {
    const { data, error } = await this.skillService.getSkills();
    if (!error && data) {
      this.skills.set(data as Skill[]);
    }
  }

  async createNewSkill() {
    if (!this.newSkillName.trim()) return;
    const { data, error } = await this.skillService.createSkill(
      this.newSkillName.trim(),
      this.newSkillCategory
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

  getUserSkillsDetailed(): { name: string; category: string; count: number; projectNames: string[] }[] {
    const skillMap = new Map<string, { name: string; category: string; count: number; projectNames: string[] }>();
    for (const p of this.projects()) {
      if (p.project_skills) {
        for (const ps of p.project_skills) {
          const s = ps.skills;
          if (s?.name) {
            const key = s.name.toLowerCase();
            if (!skillMap.has(key)) {
              skillMap.set(key, {
                name: s.name,
                category: s.category || 'Technology',
                count: 1,
                projectNames: [p.name]
              });
            } else {
              const existing = skillMap.get(key)!;
              existing.count++;
              if (!existing.projectNames.includes(p.name)) {
                existing.projectNames.push(p.name);
              }
            }
          }
        }
      }
    }
    return Array.from(skillMap.values()).sort((a, b) => b.count - a.count);
  }

  async removeSkillFromUserPortfolio(skillName: string) {
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
                if (ps.skills?.name?.toLowerCase() === skillName.toLowerCase()) {
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
      if (data.length > 0 && !this.selectedRoleId()) {
        this.selectCareerRole(data[0].id);
      }
    }
  }

  async selectCareerRole(roleId: string) {
    this.selectedRoleId.set(roleId);
    const role = this.careerRoles().find(r => r.id === roleId) || null;
    this.selectedRole.set(role);
    await this.recalculateSkillGap();
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
    const skillSet = new Set<string>();
    for (const p of this.projects()) {
      if (p.project_skills) {
        for (const ps of p.project_skills) {
          if (ps.skills?.name) skillSet.add(ps.skills.name);
        }
      }
    }
    return Array.from(skillSet);
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
      this.mlService.classifyProject(project.name, project.description || '').subscribe({
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

  async createProject() {
    if (!this.newProjectName.trim()) {
      this.showToast('Please enter a project name.', 'warning');
      return;
    }
    const { data, error } = await this.projectService.createProject(
      this.newProjectName.trim(),
      this.newProjectDesc.trim(),
      this.newProjectStatus || 'active'
    );
    if (error) {
      this.showToast('Failed to create project: ' + error.message, 'error');
    } else {
      const proj = this.newProjectName;
      this.newProjectName = '';
      this.newProjectDesc = '';
      this.newProjectStatus = 'active';
      this.showAddProjectForm.set(false);
      await this.fetchProjects();
      this.showToast(`Project "${proj}" created successfully!`, 'success');
    }
  }

  toggleAddProjectForm() {
    this.showAddProjectForm.update(v => !v);
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


  openProjectAnalysis(project: any) {
    this.activeAnalysisProject.set(project);
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
      dataUrl: publicUrl // Store the public Supabase Storage URL instead of Base64!
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
    return this.getUserSkillNames().some(s => s.toLowerCase() === skillName.toLowerCase());
  }

  private async getOrCreateResumeProject(): Promise<any> {
    const RESUME_PROJECT_NAME = '📄 Verified Resume Skills (NLP Extracted)';
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
      // 1. Ensure skill exists in global catalog or insert it
      let skillObj = this.skills().find(s => s.name.toLowerCase() === skillName.toLowerCase());
      if (!skillObj) {
        const { data: createdSkill, error } = await this.skillService.createSkill(skillName, 'Extracted Skill');
        if (error) {
          this.showToast(`Failed to register skill ${skillName}: ${error.message}`, 'error');
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
        (ps: any) => ps.skill_id === skillObj.id || ps.skills?.name?.toLowerCase() === skillName.toLowerCase()
      );

      if (!alreadyAttached) {
        await this.skillService.addSkillToProject(resumeProject.id, skillObj.id);
        await this.fetchProjects();
        this.showToast(`Added "${skillName}" to your portfolio skills!`, 'success');
      } else {
        this.showToast(`"${skillName}" is already active in your portfolio.`, 'info');
      }
    } catch (err: any) {
      this.showToast(`Error adding skill: ${err.message}`, 'error');
    }
  }

  async syncAllResumeSkillsToPortfolio() {
    const resData = this.resumeData();
    if (!resData || !resData.extracted_skills || resData.extracted_skills.length === 0) {
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

      // 3. Existing project skill ids
      const attachedSkillIds = new Set<string>(
        (resumeProj.project_skills || []).map((ps: any) => ps.skill_id)
      );

      let addedCount = 0;

      for (const skillName of resData.extracted_skills) {
        let skillId = skillMap.get(skillName.toLowerCase());

        // Create if missing in global catalog
        if (!skillId) {
          const { data: created, error } = await this.skillService.createSkill(skillName, 'Extracted Skill');
          if (!error && created) {
            skillId = created.id;
            skillMap.set(skillName.toLowerCase(), created.id);
          }
        }

        // Attach to user's resume project if not yet attached
        if (skillId && !attachedSkillIds.has(skillId)) {
          const { error: attachErr } = await this.skillService.addSkillToProject(resumeProj.id, skillId);
          if (!attachErr) {
            attachedSkillIds.add(skillId);
            addedCount++;
          }
        }
      }

      await this.fetchSkills();
      await this.fetchProjects();

      this.showToast(`Successfully synced ${resData.extracted_skills.length} resume skills to your developer portfolio!`, 'success');
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
    const targetRoleTitle = this.selectedRole()?.title || 'General Developer';

    const req = {
      user_skills: userSkills,
      missing_skills: missingSkills,
      target_role: targetRoleTitle,
      existing_projects: this.projects(),
      effort_budget_hours: this.effortBudgetHours(),
      max_projects_count: 3
    };

    this.optimizationService.getRecommendations(req).subscribe({
      next: (res) => {
        this.isOptimizing.set(false);
        this.optimizationResult.set(res);
      },
      error: (err) => {
        this.isOptimizing.set(false);
        this.showToast('Optimization Failed: ' + (err.error?.detail || err.message), 'error');
      }
    });
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
          const newSkill = await this.skillService.createSkill(skillName, rec.domain);
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
    this.selectRoleTree('AI Engineer');
    this.loadKnowledgeGraphData();
  }

  loadKnowledgeGraphData() {
    this.knowledgeService.getGraph().subscribe({
      next: (res) => this.knowledgeGraphData.set(res),
      error: (err) => console.warn('Knowledge graph load failed:', err)
    });
  }

  selectRoleTree(roleTitle: string) {
    this.selectedKnowledgeRole.set(roleTitle);
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

    const userSkills = this.getUserSkillNames();
    this.knowledgeService.getLearningPath(target, userSkills).subscribe({
      next: (res) => this.goalSkillRoadmap.set(res),
      error: (err) => console.error('Learning path calculation failed:', err)
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

    return {
      target_role: role?.title || 'Software Engineer',
      match_score: gap?.match_percentage || 0,
      health_score: score?.overall_health_score || 0,
      missing_skills: gap?.missing_skills || [],
      acquired_skills: userSkillNames,
      pillars: {
        completeness: score?.metrics?.project_volume_score || 0,
        tech_stack: score?.metrics?.skill_diversity_score || 0,
        quality: score?.metrics?.detail_quality_score || 0,
        diversity: score?.metrics?.activity_status_score || 0
      },
      projects: currentProjects
    };
  }

  sendCoachMessage(overrideMessage?: string) {
    const text = (overrideMessage || this.coachInput).trim();
    if (!text || this.coachLoading()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: time };

    this.coachMessages.update(msgs => [...msgs, userMsg]);
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
        if (res.suggested_followups?.length) {
          this.suggestedFollowups.set(res.suggested_followups);
        }
        this.coachLoading.set(false);
      },
      error: (err) => {
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `⚠️ Failed to reach AI Coach: ${err.message || 'Connection error'}. Please check if the backend is running.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.coachMessages.update(msgs => [...msgs, errorMsg]);
        this.coachLoading.set(false);
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
      onConfirm: () => {
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

  async importRepoToPortfolio(repo: GitHubRepository) {
    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }

    // Option 3 Security Check: Require GitHub OAuth verification to import
    if (!this.isGitHubOAuthVerified()) {
      this.githubError.set(
        `🔒 OAuth Verification Required: To prevent unauthorized imports and prove you own this repository, please verify via GitHub OAuth before importing.`
      );
      this.showToast('Please connect your GitHub account via OAuth to verify ownership.', 'warning');
      return;
    }

    if (!this.isScannedAccountLinked()) {
      this.githubError.set(
        `🔒 Import Restricted: You are authenticated as @${this.verifiedGitHubUsername()}. You cannot import repositories owned by @${this.githubScanData()?.profile?.username}.`
      );
      return;
    }

    this.importingRepoId.set(repo.id);
    this.githubError.set('');
    this.githubImportSuccessMsg.set('');

    try {
      const description = repo.description 
        ? `${repo.description} (Imported from GitHub: ${repo.html_url})` 
        : `Imported from GitHub: ${repo.html_url}`;

      const { data: newProject, error: projErr } = await this.projectService.createProject(
        repo.name,
        description
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
            const { data: newSkill } = await this.skillService.createSkill(skillName, 'Technology');
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

      this.githubImportSuccessMsg.set(`Successfully imported "${repo.name}" with ${repo.detected_skills?.length || 0} skills into your portfolio!`);
      this.showToast(`Imported ${repo.name}!`, 'success');
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
    const data = this.githubScanData();
    if (!data || !data.repos || data.repos.length === 0) return;
    if (!this.currentUser()) {
      this.openAuthModal('login');
      return;
    }

    // Option 3 Security Check: Require GitHub OAuth verification to import
    if (!this.isGitHubOAuthVerified()) {
      this.githubError.set(
        `🔒 OAuth Verification Required: To prevent unauthorized imports and prove you own these repositories, please verify via GitHub OAuth before importing.`
      );
      this.showToast('Please connect your GitHub account via OAuth to verify ownership.', 'warning');
      return;
    }

    if (!this.isScannedAccountLinked()) {
      this.githubError.set(
        `🔒 Import Restricted: You are authenticated as @${this.verifiedGitHubUsername()}. You cannot import repositories owned by @${this.githubScanData()?.profile?.username}.`
      );
      return;
    }

    const unimported = data.repos.filter(r => !this.isRepoAlreadyImported(r.name));
    if (unimported.length === 0) {
      this.githubImportSuccessMsg.set('All scanned repositories are already in your portfolio!');
      this.showToast('All scanned repositories are already imported!', 'info');
      return;
    }

    this.githubImportSuccessMsg.set(`Importing ${unimported.length} repositories...`);
    let count = 0;
    for (const repo of unimported) {
      try {
        await this.importRepoToPortfolio(repo);
        count++;
      } catch (e) {
        console.warn('Batch import error for', repo.name, e);
      }
    }
    await this.fetchSkills();
    await this.fetchProjects();
    this.githubImportSuccessMsg.set(`Batch import complete! Added ${count} new repositories to your portfolio.`);
    this.showToast(`Successfully imported ${count} repositories!`, 'success');
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



