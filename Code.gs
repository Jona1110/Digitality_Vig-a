const SHEET_NAME = "Alertas_BD";
const USERS_SHEET_NAME = "Usuarios_BD"; 
const FB_USERS_SHEET_NAME = "Usuarios_Facebook_BD"; // Pestaña exclusiva para Facebook
const GG_USERS_SHEET_NAME = "Usuarios_Google_BD";   // Pestaña exclusiva para Google
const HISTORY_SHEET_NAME = "Historial_Reportes"; 

function configurarBaseDeDatos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Configurar Hoja de Alertas Activas
  let sheetAlertas = ss.getSheetByName(SHEET_NAME);
  if (!sheetAlertas) {
    sheetAlertas = ss.insertSheet(SHEET_NAME);
    sheetAlertas.appendRow(["ID", "Fecha", "Tipo", "Ubicacion", "Descripcion", "Autor", "Foto"]);
    sheetAlertas.getRange("A1:G1").setFontWeight("bold").setBackground("#1e293b").setFontColor("white");
    sheetAlertas.setFrozenRows(1);
    sheetAlertas.setColumnWidth(2, 160); 
    sheetAlertas.setColumnWidth(4, 200); 
    sheetAlertas.setColumnWidth(5, 300); 
  }

  // 2. Configurar Hoja de Usuarios Locales
  let sheetUsuarios = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheetUsuarios) {
    sheetUsuarios = ss.insertSheet(USERS_SHEET_NAME);
    sheetUsuarios.appendRow(["Fecha de Registro", "Nombre / Alias", "Colonia", "Contrasena"]);
    sheetUsuarios.getRange("A1:D1").setFontWeight("bold").setBackground("#10b981").setFontColor("white");
    sheetUsuarios.setFrozenRows(1);
  }

  // 3. Configurar Hoja de Usuarios de Facebook
  let sheetFbUsuarios = ss.getSheetByName(FB_USERS_SHEET_NAME);
  if (!sheetFbUsuarios) {
    sheetFbUsuarios = ss.insertSheet(FB_USERS_SHEET_NAME);
    sheetFbUsuarios.appendRow(["Fecha de Registro", "Nombre / Alias", "Colonia", "Contrasena"]);
    sheetFbUsuarios.getRange("A1:D1").setFontWeight("bold").setBackground("#1877f2").setFontColor("white");
    sheetFbUsuarios.setFrozenRows(1);
  }

  // 4. Configurar Hoja de Usuarios de Google
  let sheetGgUsuarios = ss.getSheetByName(GG_USERS_SHEET_NAME);
  if (!sheetGgUsuarios) {
    sheetGgUsuarios = ss.insertSheet(GG_USERS_SHEET_NAME);
    sheetGgUsuarios.appendRow(["Fecha de Registro", "Nombre / Alias", "Colonia", "Contrasena"]);
    sheetGgUsuarios.getRange("A1:D1").setFontWeight("bold").setBackground("#ea4335").setFontColor("white");
    sheetGgUsuarios.setFrozenRows(1);
  }

  // 5. Configurar Hoja de Historial Privado de Eliminados
  let sheetHistorial = ss.getSheetByName(HISTORY_SHEET_NAME);
  if (!sheetHistorial) {
    sheetHistorial = ss.insertSheet(HISTORY_SHEET_NAME);
    sheetHistorial.appendRow(["ID", "Fecha Creacion", "Tipo", "Ubicacion", "Descripcion", "Autor", "Foto", "Fecha Eliminacion"]);
    sheetHistorial.getRange("A1:H1").setFontWeight("bold").setBackground("#ef4444").setFontColor("white");
    sheetHistorial.setFrozenRows(1);
  }
}

// Función auxiliar para buscar la fila por ID
function findRowIndexById(sheet, id) {
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] == id) return i + 2; 
  }
  return -1;
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return responderJSON({ error: "Base de datos no encontrada." });
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return responderJSON({ status: "success", data: [] });

  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  
  return responderJSON({ status: "success", data: result });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // --- ACCIÓN: CREAR REPORTE ---
    if (data.action === "addAlert") {
      const sheet = ss.getSheetByName(SHEET_NAME);
      const id = new Date().getTime().toString(); 
      const fecha = new Date().toISOString();
      const autor = data.autor || "Vecino Anónimo";
      
      sheet.appendRow([id, fecha, data.tipo, data.ubicacion, data.descripcion, autor, data.foto || ""]);
      return responderJSON({ status: "success", message: "Reporte registrado" });
    }
    
    // --- ACCIÓN: EDITAR REPORTE ---
    else if (data.action === "editAlert") {
      const sheet = ss.getSheetByName(SHEET_NAME);
      const rowIdx = findRowIndexById(sheet, data.id);
      
      if(rowIdx === -1) return responderJSON({ status: "error", message: "Reporte no encontrado" });
      
      sheet.getRange(rowIdx, 3).setValue(data.tipo);
      sheet.getRange(rowIdx, 4).setValue(data.ubicacion);
      sheet.getRange(rowIdx, 5).setValue(data.descripcion);
      if(data.foto !== undefined) sheet.getRange(rowIdx, 7).setValue(data.foto); 
      
      return responderJSON({ status: "success", message: "Reporte actualizado" });
    }
    
    // --- ACCIÓN: ELIMINAR REPORTE (Mover a Historial Privado) ---
    else if (data.action === "deleteAlert") {
      const sheetAlertas = ss.getSheetByName(SHEET_NAME);
      const rowIdx = findRowIndexById(sheetAlertas, data.id);
      
      if(rowIdx === -1) return responderJSON({ status: "error", message: "Reporte no encontrado" });
      
      const rowData = sheetAlertas.getRange(rowIdx, 1, 1, sheetAlertas.getLastColumn()).getValues()[0];
      let sheetHistorial = ss.getSheetByName(HISTORY_SHEET_NAME);
      if (!sheetHistorial) {
        sheetHistorial = ss.insertSheet(HISTORY_SHEET_NAME);
        sheetHistorial.appendRow(["ID", "Fecha Creacion", "Tipo", "Ubicacion", "Descripcion", "Autor", "Foto", "Fecha Eliminacion"]);
      }
      
      const fechaEliminacion = new Date().toISOString();
      sheetHistorial.appendRow([
        rowData[0], rowData[1], rowData[2], rowData[3], 
        rowData[4], rowData[5], rowData[6], fechaEliminacion
      ]);
      
      sheetAlertas.deleteRow(rowIdx);
      return responderJSON({ status: "success", message: "Reporte movido al historial privado" });
    }

    // --- ACCIÓN: REGISTRO DE USUARIO (Soporta Local, Facebook y Google) ---
    else if (data.action === "registerUser") {
      let targetSheetName = USERS_SHEET_NAME;
      if (data.provider === "facebook") targetSheetName = FB_USERS_SHEET_NAME;
      if (data.provider === "google") targetSheetName = GG_USERS_SHEET_NAME;

      const sheet = ss.getSheetByName(targetSheetName);
      const rows = sheet.getDataRange().getValues();
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1].toString().toLowerCase() === data.nombre.toLowerCase()) {
          return responderJSON({ status: "error", message: "El nombre de usuario ya está registrado en esta red." });
        }
      }

      const fecha = new Date().toISOString();
      sheet.appendRow([fecha, data.nombre, data.colonia, data.contrasena || ""]);
      return responderJSON({ status: "success", message: "Usuario registrado correctamente" });
    }

    // --- ACCIÓN: INICIAR SESIÓN (Soporta Local, Facebook y Google) ---
    else if (data.action === "loginUser") {
      let targetSheetName = USERS_SHEET_NAME;
      if (data.provider === "facebook") targetSheetName = FB_USERS_SHEET_NAME;
      if (data.provider === "google") targetSheetName = GG_USERS_SHEET_NAME;

      const sheet = ss.getSheetByName(targetSheetName);
      const rows = sheet.getDataRange().getValues();
      
      for (let i = 1; i < rows.length; i++) {
        let nombreSheet = rows[i][1].toString();
        let coloniaSheet = rows[i][2].toString();
        let passSheet = rows[i][3].toString();

        if (nombreSheet.toLowerCase() === data.nombre.toLowerCase() && passSheet === data.contrasena) {
          return responderJSON({ 
            status: "success", 
            message: "Login exitoso", 
            colonia: coloniaSheet 
          });
        }
      }
      return responderJSON({ status: "error", message: "Usuario o contraseña incorrectos en esta plataforma." });
    }
    
  } catch(error) {
    return responderJSON({ status: "error", message: error.toString() });
  }
}

function responderJSON(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}