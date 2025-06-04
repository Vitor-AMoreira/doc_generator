// js/utils.js
export function calcularIdade(dataNascimento) { // dataNascimento no formato YYYY-MM-DD
    if (!dataNascimento) return "";
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
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
