using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountingService.Migrations
{
    /// <inheritdoc />
    public partial class AddIndexesAndRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "JournalEntryId1",
                table: "JournalEntryLines",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntryLines_JournalEntryId1",
                table: "JournalEntryLines",
                column: "JournalEntryId1");

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntries_Date",
                table: "JournalEntries",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_JournalEntries_ReferenceId",
                table: "JournalEntries",
                column: "ReferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_AccountCode",
                table: "Accounts",
                column: "AccountCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Type",
                table: "Accounts",
                column: "Type");

            migrationBuilder.AddForeignKey(
                name: "FK_JournalEntryLines_JournalEntries_JournalEntryId1",
                table: "JournalEntryLines",
                column: "JournalEntryId1",
                principalTable: "JournalEntries",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JournalEntryLines_JournalEntries_JournalEntryId1",
                table: "JournalEntryLines");

            migrationBuilder.DropIndex(
                name: "IX_JournalEntryLines_JournalEntryId1",
                table: "JournalEntryLines");

            migrationBuilder.DropIndex(
                name: "IX_JournalEntries_Date",
                table: "JournalEntries");

            migrationBuilder.DropIndex(
                name: "IX_JournalEntries_ReferenceId",
                table: "JournalEntries");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_AccountCode",
                table: "Accounts");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_Type",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "JournalEntryId1",
                table: "JournalEntryLines");
        }
    }
}
