// js/utils.js
export function calcularIdade(dataNascimento) { // dataNascimento no formato YYYY-MM-DD
    if (!dataNascimento) return "";
    const hoje = new Date();
    const nasc = new Date(dataNascimento); // Date() constructor can parse YYYY-MM-DD
    if (isNaN(nasc.getTime())) return ""; // Data inválida
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mes = hoje.getMonth() - nasc.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    return idade >= 0 ? idade.toString() : "";
}

export function obterDataAtualFormatada() {
    const hoje = new Date();
    return {
        dia: hoje.getDate().toString().padStart(2, '0'),
        mes: (hoje.getMonth() + 1).toString().padStart(2, '0'),
        ano: hoje.getFullYear().toString(),
        completa: hoje.toLocaleDateString('pt-BR') // ex: 17/05/2025
    };
}

export function parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(dateStr) {
    if (!dateStr || !dateStr.trim()) return "";
    const parts = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (parts) {
        // parts[1] is day, parts[2] is month, parts[3] is year
        return `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    // Se não corresponder, pode ser que já esteja em YYYY-MM-DD ou formato inválido.
    // Retorna string original ou vazia se inválido para evitar quebrar lógicas que esperam uma string.
    return ""; // Ou dateStr, dependendo de como erros de formatação devem ser tratados. Retornar "" é mais seguro.
}