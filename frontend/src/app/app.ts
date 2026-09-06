import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  
  newSkillName = '';
  newSkillCategory = 'Programming Language';

  // Resume Parser Operations
  resumeParsing = signal<boolean>(false);
  resumeData = signal<any>(null);

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
  githubUsername = 'ch1llysauce';
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
    private systemService: SystemService
  ) {}

  async ngOnInit() {
    this.checkBackendHealth();
    this.setupAuthRecoveryListener();
    await this.loadCurrentUser();
    await this.loadInitialData();
    this.loadInitialKnowledgeData();
    this.loadCoachStatus();
    this.loadGitHubStatus();
    this.fetchSystemTelemetry();
  }


  setTab(tabName: string) {
    this.activeTab.set(tabName);
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
    // 1. Listen for Supabase recovery auth state change event
    this.authService.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.currentUser.set(session?.user ?? null);
        this.authMode.set('forgot');
        this.forgotStep.set(3);
        this.forgotSuccessMsg.set('Recovery link verified! Please enter your new password below.');
        this.authError.set('');
        this.showAuthModal.set(true);
      }
    });

    // 2. Direct check on initial URL hash for type=recovery
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        setTimeout(async () => {
          await this.loadCurrentUser();
          this.authMode.set('forgot');
          this.forgotStep.set(3);
          this.forgotSuccessMsg.set('Recovery link verified! Please enter your new password below.');
          this.authError.set('');
          this.showAuthModal.set(true);
        }, 400);
      }
    }
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
    await this.authService.signOut();
    this.currentUser.set(null);
    this.projects.set([]);
    this.portfolioScore.set(null);
    this.skillGap.set(null);
    this.strengthsList.set([]);
    this.weaknessesList.set([]);
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
    if (!error && data) {
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
    if (!this.newProjectName.trim()) return;
    const { data, error } = await this.projectService.createProject(
      this.newProjectName.trim(),
      this.newProjectDesc.trim()
    );
    if (error) {
      this.showToast('Failed to create project: ' + error.message, 'error');
    } else {
      const proj = this.newProjectName;
      this.newProjectName = '';
      this.newProjectDesc = '';
      await this.fetchProjects();
      this.showToast(`Project "${proj}" created successfully!`, 'success');
    }
  }

  async deleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    await this.projectService.deleteProject(id);
    await this.fetchProjects();
    this.showToast('Project deleted from portfolio.', 'info');
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

  async detachSkillFromProject(projectId: string, skillId: string) {
    const { error } = await this.skillService.removeSkillFromProject(projectId, skillId);
    if (error) {
      console.error('Skill detach error:', error);
    } else {
      await this.fetchProjects();
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
      alert('Please select a valid PDF file.');
      return;
    }

    this.resumeParsing.set(true);
    this.analyticsService.parseResume(file).subscribe({
      next: (res) => {
        this.resumeParsing.set(false);
        this.resumeData.set(res);
        alert(`Resume Parsed Successfully!\nExtracted ${res.extracted_skills.length} skills and ${res.extracted_projects.length} candidate projects.`);
      },
      error: (err) => {
        this.resumeParsing.set(false);
        alert('Resume Extraction Failed: ' + (err.error?.detail || err.message));
      }
    });
  }

  async importExtractedSkill(skillName: string) {
    const existing = this.skills().find(s => s.name.toLowerCase() === skillName.toLowerCase());
    if (existing) return;

    await this.skillService.createSkill(skillName, 'Extracted Skill');
    await this.fetchSkills();
  }

  async importExtractedProject(proj: any) {
    if (!this.currentUser()) {
      alert('Please login first to import projects into your portfolio.');
      return;
    }

    const { data, error } = await this.projectService.createProject(
      proj.name,
      proj.description || 'Imported from uploaded PDF resume'
    );

    if (error) {
      alert('Failed to import project: ' + error.message);
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
    alert(`Imported project "${proj.name}"!`);
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
        alert('Optimization Failed: ' + (err.error?.detail || err.message));
      }
    });
  }

  async adoptRecommendedProject(rec: RecommendedProject) {
    if (!this.currentUser()) {
      alert('Please login first to adopt this project into your portfolio.');
      return;
    }

    const { data, error } = await this.projectService.createProject(
      rec.title,
      `${rec.description}\n\nArchitecture: ${rec.architecture_highlights}`
    );

    if (error) {
      alert('Failed to add project: ' + error.message);
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
    alert(`🎉 Successfully added "${rec.title}" to your active projects! Check the Projects tab.`);
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
    this.coachMessages.set([
      {
        role: 'assistant',
        content: "Chat cleared! How can I help you elevate your developer portfolio today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }

  // GitHub Integration Handlers (Stage 14)
  loadGitHubStatus() {
    this.githubService.getStatus().subscribe({
      next: (status) => this.githubStatus.set(status),
      error: () => this.githubStatus.set({ authenticated: false, status: 'offline' })
    });
  }

  scanGitHub(username?: string) {
    const user = (username || this.githubUsername).trim();
    if (!user || this.isScanningGitHub()) return;
    this.githubUsername = user;
    this.isScanningGitHub.set(true);
    this.githubError.set('');
    this.githubImportSuccessMsg.set('');

    this.githubService.scanUser(user).subscribe({
      next: (res) => {
        this.githubScanData.set(res);
        this.isScanningGitHub.set(false);
      },
      error: (err) => {
        this.githubError.set(err.error?.detail || err.message || 'Failed to scan GitHub profile.');
        this.isScanningGitHub.set(false);
      }
    });
  }

  async importRepoToPortfolio(repo: GitHubRepository) {
    if (!this.currentUser()) {
      this.openAuthModal('login');
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
          const { data: newSkill } = await this.skillService.createSkill(skillName, 'Technology');
          if (newSkill && (newSkill as any).id) {
            const createdId = String((newSkill as any).id);
            skillId = createdId;
            existingSkillMap.set(skillName.toLowerCase(), createdId);
          }
        }
        if (skillId) {
          await this.skillService.addSkillToProject(newProject.id, skillId);
        }
      }

      await this.fetchSkills();
      await this.fetchProjects();

      this.githubImportSuccessMsg.set(`Successfully imported "${repo.name}" with ${repo.detected_skills?.length || 0} skills into your portfolio!`);
    } catch (err: any) {
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

    const unimported = data.repos.filter(r => !this.isRepoAlreadyImported(r.name));
    if (unimported.length === 0) {
      this.githubImportSuccessMsg.set('All scanned repositories are already in your portfolio!');
      return;
    }

    this.githubImportSuccessMsg.set(`Importing ${unimported.length} repositories...`);
    let count = 0;
    for (const repo of unimported) {
      await this.importRepoToPortfolio(repo);
      count++;
    }
    this.githubImportSuccessMsg.set(`Batch import complete! Added ${count} new repositories to your portfolio.`);
  }

  // Stage 15: System Telemetry, Toasts, and Export Handlers
  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', durationMs = 3800) {
    const id = ++this.toastCounter;
    this.toasts.update(current => [...current, { id, message, type }]);
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



