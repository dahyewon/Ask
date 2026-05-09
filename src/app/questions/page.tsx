"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createQuestion,
  createTag,
  deleteQuestion,
  deleteTag,
  importQuestions,
  loadAppData,
  updateQuestion,
  updateTag
} from "@/features/questions/question.repository";
import type { AppData, BulkQuestionInput } from "@/features/questions/question.repository";
import type { Question, Tag } from "@/features/questions/question.types";

type QuestionForm = {
  id?: string;
  content: string;
  tagIds: string[];
};

type TagForm = {
  id?: string;
  name: string;
  color: string;
};

const emptyQuestionForm: QuestionForm = {
  content: "",
  tagIds: []
};

const emptyTagForm: TagForm = {
  name: "",
  color: "#2563eb"
};

export default function QuestionsPage() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm);
  const [tagForm, setTagForm] = useState<TagForm>(emptyTagForm);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setData(loadAppData());
  }, []);

  const isEditingQuestion = Boolean(questionForm.id);
  const isEditingTag = Boolean(tagForm.id);
  const canSubmitQuestion = questionForm.content.trim().length > 0 && questionForm.tagIds.length > 0;
  const canSubmitTag = tagForm.name.trim().length > 0;

  const tagNameById = useMemo(() => {
    return new Map(data?.tags.map((tag) => [tag.id, tag.name]) ?? []);
  }, [data]);

  if (!data) {
    return <main className="app-shell">불러오는 중...</main>;
  }

  const uploadExcel = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadMessage("");

    try {
      const rows = await readQuestionRows(file);
      const result = importQuestions(rows);
      setData(result.data);
      setUploadMessage(`업로드 완료: 질문 ${result.added}개 추가, ${result.skipped}개 제외`);
    } catch {
      setUploadMessage("업로드에 실패했습니다. 엑셀의 첫 두 열이 질문, 태그 형식인지 확인해주세요.");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleQuestionTag = (tagId: string) => {
    setQuestionForm((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId)
        ? current.tagIds.filter((id) => id !== tagId)
        : [...current.tagIds, tagId]
    }));
  };

  const startQuestionEdit = (question: Question) => {
    setQuestionForm({
      id: question.id,
      content: question.content,
      tagIds: question.tagIds
    });
  };

  const submitQuestion = () => {
    if (!canSubmitQuestion) return;

    const nextData = questionForm.id
      ? updateQuestion({ id: questionForm.id, content: questionForm.content, tagIds: questionForm.tagIds })
      : createQuestion({ content: questionForm.content, tagIds: questionForm.tagIds });

    setData(nextData);
    setQuestionForm(emptyQuestionForm);
  };

  const removeQuestion = (questionId: string) => {
    const nextData = deleteQuestion(questionId);
    setData(nextData);
    if (questionForm.id === questionId) {
      setQuestionForm(emptyQuestionForm);
    }
  };

  const startTagEdit = (tag: Tag) => {
    setTagForm({
      id: tag.id,
      name: tag.name,
      color: tag.color
    });
  };

  const submitTag = () => {
    if (!canSubmitTag) return;

    const nextData = tagForm.id
      ? updateTag({ id: tagForm.id, name: tagForm.name, color: tagForm.color })
      : createTag({ name: tagForm.name, color: tagForm.color });

    setData(nextData);
    setTagForm(emptyTagForm);
  };

  const removeTag = (tagId: string) => {
    const nextData = deleteTag(tagId);
    setData(nextData);
    setQuestionForm((current) => ({
      ...current,
      tagIds: current.tagIds.filter((id) => id !== tagId)
    }));
    if (tagForm.id === tagId) {
      setTagForm(emptyTagForm);
    }
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <h1>질문 관리</h1>
          <p>엑셀 업로드로 질문을 한 번에 추가하고, 수동으로 질문과 태그를 관리합니다.</p>
        </div>
        <button className="btn primary" onClick={() => router.push("/")}>홈</button>
      </header>

      <section className="screen question-admin-layout">
        <div className="admin-stack">
          <div className="panel">
            <h2 className="section-title">엑셀 업로드</h2>
            <p className="muted">첫 두 열을 `질문`, `태그`로 읽습니다. 태그는 쉼표로 여러 개 입력할 수 있습니다.</p>
            <label className="upload-box">
              <input
                accept=".xlsx,.xls"
                disabled={isUploading}
                type="file"
                onChange={(event) => {
                  void uploadExcel(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <span>{isUploading ? "업로드 중..." : "엑셀 파일 선택"}</span>
            </label>
            {uploadMessage ? <p className="upload-message">{uploadMessage}</p> : null}
          </div>

          <details className="accordion-panel">
            <summary>질문 편집</summary>
            <div className="accordion-body">
              <h2 className="section-title">{isEditingQuestion ? "질문 수정" : "질문 추가"}</h2>
              <label className="field">
                질문 내용
                <textarea
                  className="text-area"
                  value={questionForm.content}
                  onChange={(event) => setQuestionForm((current) => ({ ...current, content: event.target.value }))}
                  placeholder="예: 본인의 가장 큰 강점을 설명해주세요."
                />
              </label>

              <div className="field">
                연결 태그
                <div className="tag-grid">
                  {data.tags.map((tag) => (
                    <button
                      key={tag.id}
                      className={`tag-button ${questionForm.tagIds.includes(tag.id) ? "active" : ""}`}
                      onClick={() => toggleQuestionTag(tag.id)}
                      type="button"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="actions">
                <button className="btn primary" disabled={!canSubmitQuestion} onClick={submitQuestion}>
                  {isEditingQuestion ? "수정 저장" : "질문 추가"}
                </button>
                {isEditingQuestion ? (
                  <button className="btn" onClick={() => setQuestionForm(emptyQuestionForm)}>취소</button>
                ) : null}
              </div>
            </div>
          </details>

          <details className="accordion-panel">
            <summary>태그 편집</summary>
            <div className="accordion-body">
              <h2 className="section-title">{isEditingTag ? "태그 수정" : "태그 추가"}</h2>
              <label className="field">
                태그 이름
                <input
                  className="wide-input"
                  value={tagForm.name}
                  onChange={(event) => setTagForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="예: 임원면접"
                />
              </label>
              <label className="field">
                태그 색상
                <input
                  className="color-input"
                  type="color"
                  value={tagForm.color}
                  onChange={(event) => setTagForm((current) => ({ ...current, color: event.target.value }))}
                />
              </label>
              <div className="actions">
                <button className="btn primary" disabled={!canSubmitTag} onClick={submitTag}>
                  {isEditingTag ? "태그 저장" : "태그 추가"}
                </button>
                {isEditingTag ? <button className="btn" onClick={() => setTagForm(emptyTagForm)}>취소</button> : null}
              </div>

              <div className="tag-list spaced">
                {data.tags.map((tag) => (
                  <article className="tag-row" key={tag.id}>
                    <div className="tag-meta">
                      <span className="tag-swatch" style={{ background: tag.color }} />
                      <strong>{tag.name}</strong>
                    </div>
                    <div className="row-actions">
                      <button className="btn" onClick={() => startTagEdit(tag)}>수정</button>
                      <button className="btn danger" onClick={() => removeTag(tag.id)}>삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </details>
        </div>

        <div className="panel">
          <h2 className="section-title">예상 질문</h2>
          <div className="question-list">
            {data.questions.map((question) => (
              <article className="question-row managed-question" key={question.id}>
                <div>
                  <strong>{question.content}</strong>
                  <p className="muted">
                    {question.tagIds.map((tagId) => tagNameById.get(tagId)).filter(Boolean).join(", ") || "태그 없음"}
                  </p>
                </div>
                <div className="row-actions">
                  <button className="btn" onClick={() => startQuestionEdit(question)}>수정</button>
                  <button className="btn danger" onClick={() => removeQuestion(question.id)}>삭제</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

async function readQuestionRows(file: File): Promise<BulkQuestionInput[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const normalizedRows = rows
    .map((row) => [String(row[0] ?? "").trim(), String(row[1] ?? "").trim()])
    .filter(([question, tags]) => question || tags);

  const [firstQuestion, firstTags] = normalizedRows[0] ?? [];
  const hasHeader = firstQuestion === "질문" || firstTags === "태그";
  const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows;

  return dataRows.map(([content, rawTags]) => ({
    content,
    tagNames: rawTags.split(",").map((tag) => tag.trim()).filter(Boolean)
  }));
}
