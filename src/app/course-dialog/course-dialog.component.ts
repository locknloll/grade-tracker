import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Course } from '../course';

@Component({
  selector: 'app-course-dialog',
  templateUrl: './course-dialog.component.html',
  styleUrls: ['./course-dialog.component.css']
})
export class CourseDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<CourseDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: CourseDialogData) { }

  ngOnInit(): void {
  }

  cancel(): void {
    this.dialogRef.close();
  }

}

export interface CourseDialogData {
  course: Partial<Course>;
  enableDelete: boolean;
}

export interface CourseDialogResult {
  course: Course;
  delete?: boolean;
}