import KnowledgeConfigSummary from "../../components/KnowledgeConfigSummary";
import Layout from "../../components/layouts/Layout";
import Presentation from "../../components/Presentation";

export default function HomePage() {
          const mockPrompt =
          "El asistente debe responder con tono profesional y educativo, ofreciendo respuestas claras y fundamentadas. Debe priorizar precisión y contexto relevante, evitando repeticiones o redundancias.";
        const mockFiles = [
          { name: "guia_ia.pdf", type: "pdf", size: "1.2 MB" },
          { name: "manual_usuarios.docx", type: "docx", size: "980 KB" },
          { name: "datos_referencia.txt", type: "txt", size: "250 KB" },
        ];
        const mockFlows = [
          { id: 1, name: "Flujo de Bienvenida" },
          { id: 2, name: "Flujo de Preguntas Frecuentes" },
          { id: 3, name: "Flujo de Soporte Técnico" },
        ];
  return (
    <>
      <Layout>
        <Presentation/>
        <div className="flex gap-4 mt-8">
            <KnowledgeConfigSummary
                    prompt={mockPrompt}
                    files={mockFiles}
                    flows={mockFlows}
                    environment="prod"
                  />
                  <KnowledgeConfigSummary
                    prompt={mockPrompt}
                    files={mockFiles}
                    flows={mockFlows}
                    environment="pruebas"
                  />
          </div>
      </Layout>
    </>
  );
}