/* eslint-disable require-jsdoc */
/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable jest/expect-expect */

describe("party achievements", () => {
  function waitForLoad() {
    cy.intercept("GET", "/scripts/worker.js").as("worker");
    cy.loginGM();
    cy.wait("@worker");
  }

  it("logs in as GM and button loads", () => {
    waitForLoad();
    cy.get("#AchievementButton").should("exist");
  });

  it("clicks the button and sees the achievements", () => {
    waitForLoad();
    cy.get("#AchievementButton").should("be.visible").click();
    cy.get("#achievements-sheet").should("exist");
  });

  it("should add three achievements", () => {
    waitForLoad();
    cy.get("#AchievementButton").should("be.visible").click();
    cy.get("#achievements-sheet").should("exist");

    cy.fixture("achievements").then((achievements) => {
      for (const achievement of achievements) {
        cy.wait(200);
        cy.get("button[name=add-achievement]").click();
        cy.get("#add-achievement-sheet").should("exist");
        cy.get("input[name=achievement_title]").type(achievement.name);
        cy.get("#achievement_description").type(achievement.description);
        cy.get("input[name=achievement_tags]").type(achievement.tags);
        cy.get("button[type=submit]").click();
        cy.get("#achievements-sheet").should("exist");
      }
    });
    cy.get(".achievements-container").should("exist").should("have.length", 3);
  });
});
