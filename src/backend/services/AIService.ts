/**
 * AIService — Integração com OpenRouter para análises de IA
 * Responsável por chamadas à API do OpenRouter para análise de exames médicos
 * e geração de sugestões de treino personalizadas.
 */

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export class AIService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly appUrl: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY não configurada no ambiente. Adicione a chave no arquivo .env");
    }
    this.apiKey = apiKey;
    this.model = process.env.AI_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
    this.appUrl = process.env.APP_URL || "http://localhost:3000";
  }

  /**
   * Faz uma chamada genérica ao OpenRouter e retorna o JSON parseado.
   * Centraliza a lógica de request + tratamento de erro + parse de resposta.
   */
  private async callOpenRouter(messages: OpenRouterMessage[]): Promise<any> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "HTTP-Referer": this.appUrl,
        "X-Title": "Gym Smarth",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[AIService] Erro ${response.status} na API do OpenRouter:`, JSON.stringify(errorData));
      
      if (response.status === 401) {
        throw { status: 401, message: 'Chave da API do OpenRouter inválida ou expirada. Verifique OPENROUTER_API_KEY no arquivo .env' };
      }
      if (response.status === 402) {
        throw { status: 402, message: 'Créditos insuficientes na conta do OpenRouter.' };
      }
      if (response.status === 429) {
        throw { status: 429, message: 'Limite de uso da IA atingido. Aguarde alguns minutos.' };
      }
      
      const errorMessage = errorData?.error?.message || `Erro ${response.status} na API de IA`;
      throw { status: response.status, message: errorMessage };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonString = text.replace(/```json\n?|```/g, "").trim();

    try {
      return JSON.parse(jsonString);
    } catch {
      console.error("[AIService] IA retornou resposta não-JSON:", text.slice(0, 500));
      throw new Error("A IA retornou uma resposta inválida. Tente novamente.");
    }
  }

  /**
   * Analisa um texto de exame médico e extrai restrições físicas via OpenRouter.
   */
  async analyzeMedicalExam(examText: string, fileData?: string, fileMimeType?: string) {
    console.log(`[AIService] Analisando exame médico com modelo: ${this.model}`);

    const content: any[] = [
      {
        type: "text",
        text: `Aja como um especialista em fisioterapia e medicina esportiva.
Analise o seguinte resultado de exame médico/avaliação física e extraia informações críticas para um treinador de academia.

TEXTO DO EXAME:
"${examText}"

REQUERIMENTOS DE SAÍDA (FORMATO JSON APENAS, SEM MARKDOWN):
{
  "diagnosticos_detectados": ["Condições ou diagnósticos encontrados"],
  "restricoes_movimento": ["Movimentos ou exercícios que devem ser evitados ou adaptados"],
  "sugestao_ajuste_treino": "Como os treinos devem ser adaptados de forma geral",
  "nivel_alerta": "baixo | medio | alto"
}`
      }
    ];

    if (fileData && fileMimeType) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${fileMimeType};base64,${fileData}`
        }
      });
    }

    return this.callOpenRouter([{ role: "user", content }]);
  }

  /**
   * Gera uma sugestão de treino baseada nas restrições clínicas via OpenRouter.
   */
  async generateWorkoutPlan(studentName: string, restrictions: any, goal: string) {
    console.log(`[AIService] Gerando plano de treino com modelo: ${this.model}`);

    const restrictionsText = typeof restrictions === 'string'
      ? restrictions
      : JSON.stringify(restrictions, null, 2);

    return this.callOpenRouter([
      {
        role: "user",
        content: `Aja como um Personal Trainer de elite especializado em musculação adaptada.
Monte uma sugestão de treino (Sessão A) para o aluno ${studentName}.

OBJETIVO DO ALUNO: "${goal}"
RESTRIÇÕES MÉDICAS (IMPORTANTE):
${restrictionsText}

REQUERIMENTOS (SAÍDA JSON APENAS, SEM MARKDOWN):
{
  "nome_treino": "Nome impactante para a sessão",
  "tipo": "Ex: Hipertrofia de Membros Superiores",
  "exercicios": [
    {
      "nome": "Nome do exercício",
      "series": 3,
      "repeticoes": "10-12",
      "descanso": "60s",
      "observacao_seguranca": "Explique como este exercício respeita a restrição do aluno"
    }
  ],
  "dica_mestre": "Uma dica técnica de execução para este aluno específico"
}`
      }
    ]);
  }
}
