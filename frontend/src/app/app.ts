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
  authMode = signal<'login' | 'register'>('login');
  authError = signal<string>('');

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

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private projectService: ProjectService,
    private skillService: SkillService,
    private careerRoleService: CareerRoleService,
    private analyticsService: AnalyticsService,
    private mlService: MlService,
    private optimizationService: OptimizationService
  ) {}

  async ngOnInit() {
    this.checkBackendHealth();
    await this.loadCurrentUser();
    await this.loadInitialData();
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
  openAuthModal(mode: 'login' | 'register' = 'login') {
    this.authMode.set(mode);
    this.authError.set('');
    this.showAuthModal.set(true);
  }

  closeAuthModal() {
    this.showAuthModal.set(false);
    this.authError.set('');
  }

  switchAuthMode(mode: 'login' | 'register') {
    this.authMode.set(mode);
    this.authError.set('');
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
      alert('Registration Successful! You can now log in.');
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
      alert('Error creating skill: ' + error.message);
    } else {
      this.newSkillName = '';
      await this.fetchSkills();
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
      alert('Failed to create project: ' + error.message);
    } else {
      this.newProjectName = '';
      this.newProjectDesc = '';
      await this.fetchProjects();
    }
  }

  async deleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    await this.projectService.deleteProject(id);
    await this.fetchProjects();
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
}

