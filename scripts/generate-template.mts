import ExcelJS from "exceljs";
import * as path from "path";

async function generateTemplate() {
  console.log("📄 Gerando template Excel seguro...");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Pacientes");

  sheet.columns = [
    { header: "Nome Completo", key: "full_name", width: 35 },
    { header: "CPF", key: "cpf", width: 18 },
    { header: "Data Nascimento", key: "dob", width: 18 },
    { header: "Gênero", key: "gender", width: 12 },
    { header: "Operadora", key: "contractor", width: 25 },
  ];

  const sampleRows = [
    {
      full_name: "Alberto Santos (Exemplo)",
      cpf: "123.456.789-00",
      dob: new Date("1955-05-20"),
      gender: "Masculino",
      contractor: "Unimed Campinas",
    },
    {
      full_name: "Maria Oliveira (Exemplo)",
      cpf: "234.567.890-11",
      dob: new Date("1942-10-15"),
      gender: "Feminino",
      contractor: "Bradesco Saúde",
    },
    {
      full_name: "João da Silva (Exemplo)",
      cpf: "345.678.901-22",
      dob: new Date("1980-01-01"),
      gender: "Masculino",
      contractor: "Particular (Família)",
    },
    {
      full_name: "Lucia Ferreira (Exemplo)",
      cpf: "456.789.012-33",
      dob: new Date("1960-12-25"),
      gender: "Feminino",
      contractor: "Unimed Campinas",
    },
    {
      full_name: "Roberto Gomes (Exemplo)",
      cpf: "567.890.123-44",
      dob: new Date("1975-07-07"),
      gender: "Masculino",
      contractor: "Particular (Família)",
    },
  ];

  sampleRows.forEach((row) => sheet.addRow(row));

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F2B45" },
  };

  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.join(publicDir, "template-importacao.xlsx");

  await workbook.xlsx.writeFile(filePath);

  console.log(`✅ Template criado em: ${filePath}`);
}

generateTemplate();
