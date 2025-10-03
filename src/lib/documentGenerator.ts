import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  ImageRun,
} from 'docx';
import { Company, Case } from './supabase';

type DocType =
  | 'recurso_administrativo'
  | 'contrarrazoes'
  | 'substituicao_marca'
  | 'prorrogacao_prazo'
  | 'defesa_notificacao';

type GenerateDocParams = {
  docType: DocType;
  company: Company;
  caseData: Case;
  parameters?: string;
  logoBlob?: Blob;
};


const getDocumentContent = (
  docType: DocType,
  company: Company,
  caseData: Case,
  parameters?: string
): { title: string; sections: Array<{ heading: string; content: string[] }> } => {

  const baseIntro = `${company.name}, inscrita no CNPJ sob o nº ${company.cnpj}, com endereço ${
    company.address || 'conforme cadastro'
  }, vem, respeitosamente, à presença de Vossa Senhoria, apresentar o presente documento referente ao Processo nº ${
    caseData.process_number
  }.`;

  const templates: Record<
    DocType,
    { title: string; sections: Array<{ heading: string; content: string[] }> }
  > = {
    contrarrazoes: {
      title: 'CONTRARRAZÕES AO RECURSO ADMINISTRATIVO',
      sections: [
        {
          heading: 'I - DOS FATOS',
          content: [
            baseIntro,
            'A empresa recorrente interpôs recurso administrativo questionando a decisão proferida pelo Pregoeiro, alegando supostas irregularidades no certame licitatório.',
            'Ocorre que, conforme se demonstrará adiante, as alegações apresentadas não encontram respaldo técnico, jurídico ou fático, razão pela qual devem ser rejeitadas.',
            parameters || 'Os fatos específicos do caso demonstram a regularidade do procedimento adotado.',
          ],
        },
        {
          heading: 'II - DO DIREITO',
          content: [
            'DA LEGALIDADE DO PROCEDIMENTO ADOTADO',
            'O procedimento licitatório foi conduzido em estrita observância aos princípios constitucionais da legalidade, impessoalidade, moralidade, publicidade e eficiência, conforme estabelecido no art. 37 da Constituição Federal.',
            'A Lei nº 14.133/2021 (Nova Lei de Licitações) estabelece em seu art. 3º que a licitação destina-se a garantir a observância do princípio constitucional da isonomia, a seleção da proposta acentuadamente mais vantajosa para a administração e a promoção do desenvolvimento nacional sustentável.',
            'DA IMPROCEDÊNCIA DAS ALEGAÇÕES',
            'As alegações apresentadas pela recorrente não merecem prosperar, uma vez que carecem de fundamentação jurídica adequada e de respaldo nos autos do processo.',
            'Todos os atos praticados foram devidamente motivados e publicados, garantindo-se ampla transparência e possibilidade de contraditório, em observância ao devido processo legal administrativo.',
          ],
        },
        {
          heading: 'III - DO PEDIDO',
          content: [
            'Diante do exposto, requer-se:',
            'a) O conhecimento e provimento das presentes contrarrazões;',
            'b) A rejeição integral do recurso interposto pela empresa concorrente;',
            'c) A manutenção da decisão proferida pelo Pregoeiro;',
            'd) Sejam os autos remetidos à autoridade superior para ratificação.',
            'Termos em que,',
            'Pede deferimento.',
          ],
        },
      ],
    },
    recurso_administrativo: {
      title: 'RECURSO ADMINISTRATIVO',
      sections: [
        {
          heading: 'I - DOS FATOS',
          content: [
            baseIntro,
            'Vem a requerente, tempestivamente, interpor o presente RECURSO ADMINISTRATIVO contra a decisão que [descrever a decisão recorrida].',
            parameters || 'Os fatos que motivam o presente recurso estão detalhadamente descritos nos autos.',
            'A decisão ora recorrida viola frontalmente os princípios constitucionais aplicáveis às licitações públicas.',
          ],
        },
        {
          heading: 'II - DO DIREITO',
          content: [
            'DO CABIMENTO DO RECURSO',
            'O presente recurso encontra amparo no art. 165 da Lei nº 14.133/2021, que assegura o direito de recurso aos licitantes.',
            'DA ILEGALIDADE DA DECISÃO RECORRIDA',
            'A decisão proferida viola os princípios da isonomia, da competitividade e da economicidade, conforme demonstrado a seguir:',
            'A interpretação adotada contraria jurisprudência pacífica do Tribunal de Contas da União sobre a matéria.',
            'Os requisitos impostos são manifestamente descabidos e criam restrições indevidas à participação no certame.',
          ],
        },
        {
          heading: 'III - DO PEDIDO',
          content: [
            'Diante do exposto, requer-se:',
            'a) O conhecimento e provimento do presente recurso;',
            'b) A reforma da decisão recorrida;',
            'c) Sejam observados os princípios constitucionais aplicáveis;',
            'd) A produção de todas as provas admitidas em direito.',
            'Termos em que,',
            'Pede deferimento.',
          ],
        },
      ],
    },
    substituicao_marca: {
      title: 'SOLICITAÇÃO DE SUBSTITUIÇÃO DE MARCA',
      sections: [
        {
          heading: 'I - DO PEDIDO',
          content: [
            baseIntro,
            'Vem requerer a SUBSTITUIÇÃO DE MARCA do produto ofertado na licitação em referência.',
            parameters || 'A necessidade de substituição decorre de circunstâncias supervenientes.',
          ],
        },
        {
          heading: 'II - DA JUSTIFICATIVA',
          content: [
            'A marca originalmente proposta encontra-se temporariamente indisponível no mercado devido a [motivo].',
            'A marca substituta atende integralmente às especificações técnicas exigidas no edital.',
            'A substituição não implica em alteração de preço ou condições da proposta.',
            'Anexa-se documentação técnica comprobatória da equivalência entre os produtos.',
          ],
        },
        {
          heading: 'III - DA CONCLUSÃO',
          content: [
            'A substituição pretendida está prevista no edital e na legislação aplicável.',
            'Não há prejuízo à Administração ou aos demais licitantes.',
            'Requer-se o deferimento da presente solicitação de substituição de marca.',
            'Termos em que,',
            'Pede deferimento.',
          ],
        },
      ],
    },
    prorrogacao_prazo: {
      title: 'SOLICITAÇÃO DE PRORROGAÇÃO DE PRAZO',
      sections: [
        {
          heading: 'I - DO PEDIDO',
          content: [
            baseIntro,
            'Vem requerer a PRORROGAÇÃO DO PRAZO para [especificar o ato: apresentação de documentos, cumprimento de diligência, etc.].',
            parameters ||
              'A necessidade de prorrogação decorre de circunstâncias alheias à vontade da requerente.',
          ],
        },
        {
          heading: 'II - DA JUSTIFICATIVA',
          content: [
            'O prazo originalmente estabelecido mostrou-se insuficiente devido a [motivo específico].',
            'A empresa envidou todos os esforços para atender ao prazo inicialmente fixado.',
            'A prorrogação não causará prejuízos ao certame ou ao interesse público.',
            'Solicita-se prazo adicional de [número] dias úteis para cumprimento integral da exigência.',
          ],
        },
        {
          heading: 'III - DA CONCLUSÃO',
          content: [
            'A prorrogação de prazos é expressamente prevista na legislação, desde que devidamente justificada.',
            'O deferimento do pedido preserva o interesse público e a competitividade do certame.',
            'Requer-se o deferimento da presente solicitação de prorrogação de prazo.',
            'Termos em que,',
            'Pede deferimento.',
          ],
        },
      ],
    },
    defesa_notificacao: {
      title: 'DEFESA CONTRA NOTIFICAÇÃO',
      sections: [
        {
          heading: 'I - DOS FATOS',
          content: [
            baseIntro,
            'Vem apresentar DEFESA em face da notificação recebida em [data], que aponta suposta irregularidade.',
            parameters || 'Os fatos narrados na notificação não correspondem à realidade.',
          ],
        },
        {
          heading: 'II - DA DEFESA',
          content: [
            'DA INEXISTÊNCIA DE IRREGULARIDADE',
            'Contrariamente ao alegado na notificação, a empresa agiu em conformidade com todas as normas aplicáveis.',
            'A documentação acostada comprova a regularidade da conduta adotada.',
            'DO CUMPRIMENTO DAS OBRIGAÇÕES CONTRATUAIS',
            'Todas as obrigações previstas no contrato foram rigorosamente cumpridas nos prazos estabelecidos.',
            'Eventual divergência de interpretação não caracteriza irregularidade ou má-fé.',
          ],
        },
        {
          heading: 'III - DO PEDIDO',
          content: [
            'Diante do exposto, requer-se:',
            'a) O acolhimento da presente defesa;',
            'b) O arquivamento do procedimento instaurado;',
            'c) A manutenção da empresa em situação regular;',
            'd) Sejam considerados os documentos anexos.',
            'Termos em que,',
            'Pede deferimento.',
          ],
        },
      ],
    },
  };

  return templates[docType];
};

export async function generateDocument(params: GenerateDocParams): Promise<Blob> {
  const { docType, company, caseData, parameters, logoBlob } = params;

  const content = getDocumentContent(docType, company, caseData, parameters);
  const today = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const children: Paragraph[] = [];

  if (logoBlob) {
    try {
      const arrayBuffer = await logoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const imageType = logoBlob.type.includes('png') ? 'image/png' : 'image/jpeg';

      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: uint8Array,
              transformation: {
                width: 100,
                height: 100,
              },
              type: imageType === 'image/png' ? 'png' : 'jpg',
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );
    } catch (error) {
      console.warn('Failed to add logo to document:', error);
    }
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: company.name.toUpperCase(),
          bold: true,
          size: 24,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `CNPJ: ${company.cnpj}`,
          size: 20,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  if (company.address) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: company.address,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  if (company.email || company.phone) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${company.email}${company.phone ? ' | ' + company.phone : ''}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  children.push(
    new Paragraph({
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      },
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: content.title,
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Processo: ${caseData.process_number}`,
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Órgão: ${caseData.agency}`,
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'EXCELENTÍSSIMO(A) SENHOR(A) PREGOEIRO(A),',
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  content.sections.forEach((section) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.heading,
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: 300, after: 200 },
      })
    );

    section.content.forEach((text) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 22,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
          indent: { firstLine: convertInchesToTwip(0.5) },
        })
      );
    });
  });

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `São Paulo, ${today}.`,
          size: 22,
        }),
      ],
      spacing: { before: 400, after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '_'.repeat(50),
          size: 22,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: company.name,
          bold: true,
          size: 22,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `CNPJ: ${company.cnpj}`,
          size: 20,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  const { Packer } = await import('docx');
  const blob = await Packer.toBlob(doc);
  return blob;
}
