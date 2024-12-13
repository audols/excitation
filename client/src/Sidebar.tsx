import { docs, useAppState, sortBy } from "./State";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Citation, Review } from "./Types";
import { CitationUX } from "./Citation";
import {
  DocumentRegular,
  DocumentOnePageRegular,
  DocumentOnePageMultipleRegular,
  DocumentOnePageAddRegular,
  DismissRegular,
  CheckmarkRegular,
  EditRegular,
  EditFilled,
} from "@fluentui/react-icons";
import {
  useAsyncHelper,
  useDispatchHandler,
  useStopProp,
} from "./Hooks";
import {
  HoverableIcon,
} from './Hooks.tsx';
import { SidebarHeader } from "./SidebarHeader";

const maxPageNumber = 1000;
const unlocatedPage = maxPageNumber;

interface PageGroup {
  firstPage: number;
  lastPage: number;
  citationIndex: number;
}

const sortIndex = sortBy(
  ({ firstPage, lastPage }: PageGroup) => firstPage * maxPageNumber + lastPage
);

// const sortCitation = (questionCitations: Citation[]) => sortBy((citationIndex: number) => {
//   const { review } = questionCitations[citationIndex];
//   return review * 1000 + citationIndex;
// });

export function Sidebar() {
  const [state, dispatch] = useAppState();
  const { questions, ux } = state;
  const {
    pageNumber,
    questionIndex,
    selectedCitation,
    documentId,
    editingAnswer,
  } = ux;
  const question = questions[questionIndex];
  const { citations, answer } = question;

  const { isAsyncing, isError } = useAsyncHelper();
  const stopProp = useStopProp();

  const groupedCitations = useMemo(
    () =>
      docs.map((doc) => {
        const docSelected = doc.documentId == documentId;

        const pageGroups = citations
          // we bind each citation to its index, because filter will change the index
          .map<[Citation, number]>((citation, citationIndex) => [
            citation,
            citationIndex,
          ])
          // one document at a time
          .filter(([citation]) => citation.documentId === doc.documentId)
          // some citations span pages, so we gather first and last pages
          .map(([citation, citationIndex]) => {
            const pageNumbers = (
              citation.bounds ?? [{ pageNumber: unlocatedPage }]
            )
              .map(({ pageNumber }) => pageNumber)
              .sort();
            return {
              firstPage: pageNumbers[0],
              lastPage: pageNumbers[pageNumbers.length - 1],
              citationIndex,
            };
          })
          // now we group citations that are on the same page
          // .reduce<PageGroup[]>((pageGroups, pageGroup) => {
          //   const matchingPageGroup = pageGroups.find(
          //     ({ firstPage, lastPage }) =>
          //       firstPage == pageGroup.firstPage &&
          //       lastPage == pageGroup.lastPage
          //   );
          //   if (matchingPageGroup) {
          //     matchingPageGroup.citationIndices.push(
          //       pageGroup.citationIndices[0]
          //     );
          //   } else {
          //     pageGroups.push(pageGroup); // this is where it's handy to already be working with arrays of indices
          //   }
          //   return pageGroups;
          // }, [])
          // // sort the indices within each page group
          // .map(({ firstPage, lastPage, citationIndices }) => ({
          //   firstPage,
          //   lastPage,
          //   citationIndices /*: citationIndices.sort(sortCitation(citations))*/,
          // }))
          // and sort the page groups themselves
          .sort(sortIndex)
          // note whether a given page group is selected
          .map(({ firstPage, lastPage, citationIndex }) => {
            const pageGroupSelected =
              docSelected &&
              (selectedCitation
                ? selectedCitation.citationIndex === citationIndex
                : pageNumber !== undefined &&
                  pageNumber >= firstPage &&
                  pageNumber <= lastPage);
            return {
              firstPage,
              lastPage,
              citationIndex,
              pageGroupSelected,
            };
          });
        return {
          doc,
          docSelected,
          pageGroups: pageGroups.map((pageGroup, pageGroupIndex) => ({
            ...pageGroup,
            prevPageGroupSelected:
              pageGroups[pageGroupIndex - 1]?.pageGroupSelected,
            nextPageGroupSelected:
              pageGroups[pageGroupIndex + 1]?.pageGroupSelected,
          })),
          firstPageGroupSelected:
            docSelected && pageGroups[0]?.pageGroupSelected,
          lastPageGroupSelected:
            docSelected && pageGroups[pageGroups.length - 1]?.pageGroupSelected,
          noCitations: docSelected && !pageGroups.length,
        };
      }),
    [citations, pageNumber, documentId, selectedCitation]
  );

  const unreviewedCitations = citations.filter(
    ({ review }) => review === Review.Unreviewed
  );

  const { dispatchHandler, dispatchUnlessError } = useDispatchHandler();

  const addSelection = useCallback(
    (event: React.MouseEvent) => {
      dispatch({ type: "addSelection" });
      document.getSelection()?.empty();
      event.stopPropagation();
    },
    [dispatch]
  );

  const answerRef = useRef<HTMLTextAreaElement>(null);
  const [editAnswer, setEditAnswer] = useState<string | undefined>(undefined);

  const startEditAnswer = useCallback(
    (e: React.MouseEvent) => {
      setEditAnswer(answer);
      dispatch({ type: "startEditAnswer" });
      e.stopPropagation();
    },
    [dispatch, setEditAnswer, answer]
  );

  const cancelEditAnswer = useCallback(
    (e: React.MouseEvent) => {
      setEditAnswer(undefined);
      dispatch({ type: "cancelEditAnswer" });
      e.stopPropagation();
    },
    [dispatch]
  );

  const onChangeAnswer = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditAnswer(e.target.value);
      e.stopPropagation();
    },
    []
  );

  const updateAnswer = useCallback(
    (e: React.MouseEvent) => {
      dispatch({ type: "updateAnswer", answer: editAnswer! });
      setEditAnswer(undefined);
      e.stopPropagation();
    },
    [dispatch, editAnswer]
  );

  useEffect(() => {
    if (editingAnswer && answerRef.current) {
      answerRef.current.focus();
      answerRef.current.select();
    }
  }, [editingAnswer]);

  const Edit = () => <HoverableIcon
    DefaultIcon={EditRegular}
    HoverIcon={EditFilled}
    key="edit"
    classes="edit off"
    onClick={startEditAnswer}
  />;

  return (
    <div id="sidebar" onClick={dispatchUnlessError({ type: "selectCitation" })}>
      <SidebarHeader />
      <div className="sidebar-divider" />
      <h4 id="citations-label">Citations</h4>
      <div className="sidebar-divider" />
      <div id="docs">
        {groupedCitations.map(
          ({
            doc: { documentId, pdfUrl, name },
            docSelected,
            pageGroups,
            firstPageGroupSelected,
            lastPageGroupSelected,
            noCitations,
          }) => {
            return (
              <div className="doc" key={documentId}>
                <DocSpacer docSelected={docSelected} className="prefix" />
                <div
                  className={`doc-main ${
                    docSelected ? "selected" : "unselected"
                  }`}
                >
                  <DocHeader
                    firstPageGroupSelected={firstPageGroupSelected}
                    docSelected={docSelected}
                    noCitations={noCitations}
                    documentId={documentId}
                    name={name ?? pdfUrl}
                  />
                  {pageGroups.map(
                    (
                      {
                        firstPage,
                        lastPage,
                        citationIndex,
                        pageGroupSelected,
                        prevPageGroupSelected,
                        nextPageGroupSelected,
                      },
                      key
                    ) => (
                      <PageGroupHeader
                        documentId={docSelected ? undefined : documentId}
                        firstPage={firstPage}
                        lastPage={lastPage}
                        pageGroupSelected={pageGroupSelected}
                        prevPageGroupSelected={prevPageGroupSelected}
                        nextPageGroupSelected={nextPageGroupSelected}
                        key={key}
                      >
                        <CitationUX
                          key={citationIndex}
                          citationIndex={citationIndex}
                          review={citations[citationIndex].review}
                          selected={
                            selectedCitation?.citationIndex == citationIndex
                          }
                        />
                      </PageGroupHeader>
                    )
                  )}
                  <div className="doc-footer">
                    <div
                      className={
                        docSelected
                          ? lastPageGroupSelected
                            ? "last-page-group-selected"
                            : "selected"
                          : "unselected"
                      }
                    />
                  </div>
                </div>
                {!docSelected && <div className="sidebar-divider" />}
                <DocSpacer docSelected={docSelected} className="suffix" />
              </div>
            );
          }
        )}
        <div className="buttons" key="buttons">
          {isError && (
            <div>
              &nbsp;
              <button onClick={dispatchHandler({ type: "asyncRetry" })}>
                Retry
              </button>
              &nbsp;
              <button onClick={dispatchHandler({ type: "asyncRevert" })}>
                Revert
              </button>
            </div>
          )}
          <div id="answer">
            <div className="answer-section">
              You can manually add additional citations by navigating the
              documents, selecting relevant text, and
              {isAsyncing || ux.range == undefined ? (
                " clicking here"
              ) : (
                <>
                  &nbsp;
                  <span className="action" onClick={addSelection}>
                    clicking here
                  </span>
                </>
              )}
            </div>
            <h4>Answer</h4>
            {editingAnswer ? (
              <>
                <textarea
                  ref={answerRef}
                  className="answer-section"
                  id="edit-answer"
                  value={editAnswer}
                  onChange={onChangeAnswer}
                  onClick={stopProp}
                />
                <div
                  className="icon-container edit-cancel"
                  onClick={cancelEditAnswer}
                >
                  <DismissRegular className="icon" />
                </div>
                <div
                  className="icon-container edit-save"
                  onClick={updateAnswer}
                >
                  <CheckmarkRegular className="icon" />
                </div>
              </>
            ) : unreviewedCitations.length ? (
              <div className="answer-section">
                Before you can answer the question you must review all suggested
                citations.
              </div>
            ) : answer === undefined ? (
              <>
                <div className="answer-section">
                  When you are ready, you can&nbsp;
                  <span className="action" onClick={startEditAnswer}>
                    answer the question
                  </span>
                  .
                </div>
              </>
            ) : (
              <>
                <div className="answer-section">{answer}</div>
                <Edit />
              </>
            )}
          </div>
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
        </div>
        <div className="sidebar-divider" />
      </div>
    </div>
  );
}

const DocSpacer = ({
  docSelected,
  className,
}: {
  docSelected: boolean;
  className: string;
}) => (
  <div className="doc-spacer">
    <div className={docSelected ? className : ""} />
  </div>
);

const DocHeader = ({
  firstPageGroupSelected,
  docSelected,
  noCitations,
  documentId,
  name,
}: {
  firstPageGroupSelected: boolean;
  docSelected: boolean;
  noCitations: boolean;
  documentId: number;
  name: string;
}) => {
  const { dispatchUnlessError } = useDispatchHandler();

  return (
    <>
      <div
        className={`doc-header ${
          firstPageGroupSelected ? "first-page-selected" : ""
        }`}
        onClick={
          docSelected
            ? undefined
            : dispatchUnlessError({ type: "goto", documentId })
        }
      >
        <DocumentRegular className="icon" />
        {name}
      </div>
      {firstPageGroupSelected && (
        <div className="bottom-right">
          <div />
        </div>
      )}
      {noCitations && <div className="sidebar-divider" />}
    </>
  );
};

const PageGroupHeader = ({
  documentId,
  firstPage,
  lastPage,
  pageGroupSelected,
  prevPageGroupSelected,
  nextPageGroupSelected,
  children,
}: {
  documentId?: number;
  firstPage: number;
  lastPage: number;
  pageGroupSelected: boolean;
  prevPageGroupSelected: boolean;
  nextPageGroupSelected: boolean;
  children: ReactNode;
}) => {
  const { dispatchUnlessError } = useDispatchHandler();

  return (
    <div
      className={`page-group ${pageGroupSelected ? "selected" : "unselected"}`}
      key={firstPage * maxPageNumber + lastPage}
    >
      <div
        className={`page-header ${
          pageGroupSelected ? "selected" : "unselected"
        }`}
        onClick={
          pageGroupSelected
            ? undefined
            : dispatchUnlessError({
                type: "goto",
                pageNumber: firstPage,
                documentId,
              })
        }
      >
        {firstPage == lastPage ? (
          firstPage == unlocatedPage ? (
            <>
              <DocumentOnePageAddRegular className="icon" />
              Unable to locate citation
            </>
          ) : (
            <>
              <DocumentOnePageRegular className="icon" />
              Page {firstPage}
            </>
          )
        ) : (
          <>
            <DocumentOnePageMultipleRegular className="icon" />
            Pages {firstPage}-{lastPage}
          </>
        )}
      </div>
      {prevPageGroupSelected && (
        <div className="top-right">
          <div />
        </div>
      )}
      {children}
      {nextPageGroupSelected && (
        <div className="bottom-right">
          <div />
        </div>
      )}
    </div>
  );
};
