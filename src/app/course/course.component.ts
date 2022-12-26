import { Component, OnInit, Input } from '@angular/core';

import { Item } from '../item';
import { Course } from '../course';
import * as jsonata from 'jsonata';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { ItemDialogComponent, ItemDialogResult } from '../item-dialog/item-dialog.component';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
export class CourseComponent implements OnInit {

  @Input() course: Course = { name: "", number: "", creditHours: 0}; 

  displayedColumns = ['name','grade','outOf','weight','actions'];
  items: Item[] = [];
  courseMetrics: any = {};
  groupedItems: any = {};

  constructor(private store: AngularFirestore,
              private dialog: MatDialog) { }

  ngOnInit(): void {
    this.getItems().subscribe((items: Item[]) => { 
      this.courseMetrics = this.getCourseMetrics(items);
      this.groupedItems = this.groupItems(items);
      this.items = items;
    });
  }

  getItems(): Observable<Item[]> {
    return this.store.collection('item').valueChanges({ idField: 'id' }) as Observable<Item[]>;
  }

  newItem(course: Course): void {
    const dialogRef = this.dialog.open(ItemDialogComponent, {
      width: '350px',
      data: { item: { course: course } },
    });
    dialogRef.afterClosed()
      .subscribe((result: ItemDialogResult | undefined) => {
        if (!result) {
          return;
        }
        this.store.collection('item').add(result.item);
    });
  }

  editItem(item: Item): void {
    const dialogRef = this.dialog.open(ItemDialogComponent, {
      width: '350px',
      data: { item },
    });
    dialogRef.afterClosed()
      .subscribe((result: ItemDialogResult | undefined) => {
        if (!result) {
          return;
        }
        this.store.collection('item').doc(item.id).update(item);
    });
  }

  deleteItem(id: string) {
    this.store.collection('item').doc(id).delete();
  }

  groupItems(items: Item[]): void {
    const groupItemsJsonata = `
    (
      $courses := $distinct($.course.number);
      $groupItemsByCourse := function($c) {
        { 
          $c: [$[course.number=$c].$sift(function($v, $k) {
            $k ~> /^(name|grade|outOf|weight|id)/
          })]
        }
      };
      $count($) > 0 ? $merge($courses.$groupItemsByCourse($)) : {}
    )`;
    const exp = jsonata(groupItemsJsonata);
    return exp.evaluate(items);
  }

  getCourseMetrics(items: Item[]): void {
    const jsonataString = `
    (
      $courses := $distinct($.course);
      $getCourseMetrics := function($c) {
        (
          $items := $[course.name=$c.name];
          $weightTotal := $sum($items.weight);
          $grade := $round($sum($items.$itemizedGrade($, $weightTotal))*100,2);
          {
            $c.number: {
              "name": $c.name,
              "number": $c.number,
              "creditHours": $c.creditHours,
              "numericGrade": $grade,
              "grade": $grade >= 90 ? "A" : $grade >= 80 ? "B" : $grade >= 70 ? "C" : $grade >= 60 ? "D" : "F",
              "gpa": $grade >= 90 ? 4 : $grade >= 80 ? 3 : $grade >= 70 ? 2 : $grade >= 60 ? 1 : 0
            }
          }
        )
      };
      $itemizedGrade := function($i, $wt) {
          $i.grade/$i.outOf*$i.weight/$wt
      };
      $calcGpa := function($cm) {
        (
          $quotient := $cm.($.*.creditHours * $.*.gpa);
          $divisor := $sum($cm.*.creditHours);
          $round($sum($quotient)/$divisor, 2)
        )
      };
      $courseMetrics := $courses.$getCourseMetrics($);
      $merge($append({"gpa": $calcGpa($courseMetrics)}, $courseMetrics))
    )`;
    const exp = jsonata(jsonataString);
    return exp.evaluate(items);
  }

}
