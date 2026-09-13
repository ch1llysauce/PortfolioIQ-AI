import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'app-printable-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './printable-dossier.component.html',
  host: { style: 'display: contents;' }
})
export class PrintableDossierComponent {
  public app = inject(App);
}
