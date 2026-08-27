import React, { useEffect, useState } from "react";
import Navbar from "../../shared/components/Navbar";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "../../deploy/styles/Dashboard.css";
import { gsap } from "gsap";
import HackerText from "../../shared/components/HackerText";
import StaggeredText from "../../shared/components/StaggeredText";
import MouseTrail from "../../auth/components/MouseTrail";
import useAdmin from "../hooks/useAdmin";

export default function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);
  const {
    getAllUsers,
    getAllAdminProjects,
    deleteProjectById,
    users,
    projects,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("projects"); // "projects" or "users"
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { appId, name }
  const [deleting, setDeleting] = useState(false);

  const pageRef = React.useRef(null);

  useEffect(() => {
    document.body.style.background = "#000000";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([getAllUsers(), getAllAdminProjects()]);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(
        ".dash-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      )
        .fromTo(
          ".admin-stats",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.2)" },
          "-=0.4",
        )
        .fromTo(
          ".admin-table-container",
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          "-=0.2",
        );
    }, pageRef);
    return () => ctx.revert();
  }, [isLoading]);

  const handleMouseMove = (e) => {
    if (pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pageRef.current.style.setProperty("--mouse-x", `${x}px`);
      pageRef.current.style.setProperty("--mouse-y", `${y}px`);
    }
  };

  const handleDeleteClick = (appId, repoName) => {
    setDeleteConfirm({ appId, name: repoName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    const success = await deleteProjectById(deleteConfirm.appId);
    setDeleting(false);

    if (success) {
      setDeleteConfirm(null);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div
        style={{
          backgroundColor: "#000",
          color: "#fff",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "var(--fm)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{ color: "#ff2a4d", fontSize: "2rem", marginBottom: "1rem" }}
          >
            <HackerText text="ACCESS DENIED" />
          </h1>
          <p>You do not have the required permissions to view this page.</p>
          <Link
            to="/dashboard"
            style={{
              color: "var(--accent)",
              textDecoration: "none",
              marginTop: "1rem",
              display: "inline-block",
            }}
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={pageRef}
      className="dashboard-page"
      onMouseMove={handleMouseMove}
      style={{
        backgroundColor: "#050505",
        backgroundImage:
          "radial-gradient(circle at 15% 50%, rgba(var(--acid-rgb, 255,255,255), 0.03) 0%, transparent 40%), radial-gradient(circle at 85% 30%, rgba(var(--acid-rgb, 255,255,255), 0.04) 0%, transparent 40%)",
        color: "#fff",
        minHeight: "100vh",
        paddingBottom: "4rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <MouseTrail compact />
      <div className="noise-overlay" style={{ opacity: 0.15, zIndex: 0 }} />

      {/* Interactive Cursor Spotlight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh), rgba(var(--acid-rgb, 232, 255, 0), 0.05), transparent 60%)",
          pointerEvents: "none",
          zIndex: 1,
          transition: "background 0.1s ease",
        }}
      ></div>

      <Navbar />

      <main
        className="dash-main"
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
          width: "100%",
          paddingTop: "1rem",
          zIndex: 10,
          position: "relative",
        }}
      >
        <header className="dash-header" style={{ marginBottom: "2rem" }}>
          <div className="dash-header-left">
            <h1
              className="dash-title"
              style={{
                fontSize: "2rem",
                marginBottom: "0.2rem",
                color: "var(--accent)",
              }}
            >
              <HackerText text="SYSTEM COMMAND CENTER" />
            </h1>
            <p
              className="dash-subtitle"
              style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)" }}
            >
              Administrator Access
            </p>
          </div>
        </header>

        {/* Global Stats */}
        <div
          className="admin-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          <div
            className="dash-card"
            style={{
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.4)",
              borderRadius: "8px",
            }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--fm)",
                marginBottom: "0.5rem",
              }}
            >
              TOTAL PROJECTS
            </h3>
            <div
              style={{
                fontSize: "2.5rem",
                fontFamily: "var(--fb)",
                color: "#fff",
              }}
            >
              {projects.length}
            </div>
          </div>
          <div
            className="dash-card"
            style={{
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.4)",
              borderRadius: "8px",
            }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--fm)",
                marginBottom: "0.5rem",
              }}
            >
              TOTAL USERS
            </h3>
            <div
              style={{
                fontSize: "2.5rem",
                fontFamily: "var(--fb)",
                color: "#fff",
              }}
            >
              {users.length}
            </div>
          </div>
          <div
            className="dash-card"
            style={{
              padding: "1.5rem",
              border: "1px solid var(--accent)",
              background: "rgba(var(--acid-rgb, 232, 255, 0), 0.05)",
              borderRadius: "8px",
            }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                color: "var(--accent)",
                fontFamily: "var(--fm)",
                marginBottom: "0.5rem",
              }}
            >
              SYSTEM STATUS
            </h3>
            <div
              style={{
                fontSize: "2.5rem",
                fontFamily: "var(--fb)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  boxShadow: "0 0 10px var(--accent)",
                }}
              ></div>
              ONLINE
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            marginBottom: "2rem",
            paddingBottom: "0.5rem",
            fontFamily: "var(--fm)",
            fontSize: "1rem",
          }}
        >
          <button
            onClick={() => setActiveTab("projects")}
            style={{
              background: "transparent",
              border: "none",
              color:
                activeTab === "projects" ? "#fff" : "rgba(255,255,255,0.5)",
              borderBottom:
                activeTab === "projects" ? "2px solid var(--accent)" : "none",
              paddingBottom: "0.5rem",
              marginBottom: "-0.6rem",
              cursor: "pointer",
              fontFamily: "var(--fb)",
            }}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveTab("users")}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === "users" ? "#fff" : "rgba(255,255,255,0.5)",
              borderBottom:
                activeTab === "users" ? "2px solid var(--accent)" : "none",
              paddingBottom: "0.5rem",
              marginBottom: "-0.6rem",
              cursor: "pointer",
              fontFamily: "var(--fb)",
            }}
          >
            All Users
          </button>
        </div>

        {/* Data Table */}
        <div
          className="admin-table-container dash-card"
          style={{
            padding: 0,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
                fontFamily: "var(--fm)",
              }}
            >
              Loading system data...
            </div>
          ) : activeTab === "projects" ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "var(--fm)",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      App ID
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Repository
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Created At
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                        textAlign: "center",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length > 0 ? (
                    projects.map((proj) => (
                      <tr
                        key={proj._id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            fontFamily: "monospace",
                          }}
                        >
                          {proj.appId}
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            color: "var(--accent)",
                          }}
                        >
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {proj.repoUrl?.split("/").slice(-2).join("/") ||
                              "Unknown"}
                          </a>
                        </td>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          {proj.type?.RepoType || "Unknown"}
                        </td>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <span
                            style={{
                              padding: "0.2rem 0.6rem",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              background:
                                proj.status === "running"
                                  ? "rgba(0, 230, 118, 0.1)"
                                  : proj.status === "failed"
                                    ? "rgba(255, 42, 77, 0.1)"
                                    : "rgba(255, 255, 255, 0.1)",
                              color:
                                proj.status === "running"
                                  ? "#00e676"
                                  : proj.status === "failed"
                                    ? "#ff2a4d"
                                    : "#fff",
                              border:
                                proj.status === "running"
                                  ? "1px solid rgba(0, 230, 118, 0.3)"
                                  : proj.status === "failed"
                                    ? "1px solid rgba(255, 42, 77, 0.3)"
                                    : "1px solid rgba(255, 255, 255, 0.2)",
                            }}
                          >
                            {proj.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {new Date(proj.createdAt).toLocaleDateString()}
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleDeleteClick(
                                proj._id,
                                proj.repoUrl?.split("/").slice(-2).join("/") ||
                                  "Unknown",
                              )
                            }
                            style={{
                              background: "rgba(255, 42, 77, 0.1)",
                              border: "1px solid rgba(255, 42, 77, 0.3)",
                              color: "#ff2a4d",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontFamily: "var(--fm)",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255, 42, 77, 0.2)";
                              e.currentTarget.style.boxShadow =
                                "0 0 10px rgba(255, 42, 77, 0.5)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(255, 42, 77, 0.1)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        No projects found in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "var(--fm)",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      User ID
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Full Name
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((u) => (
                      <tr
                        key={u._id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            fontFamily: "monospace",
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {u._id.substring(0, 10)}...
                        </td>
                        <td
                          style={{ padding: "1rem 1.5rem", fontWeight: "bold" }}
                        >
                          {u.fullName}
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            color: "var(--accent)",
                          }}
                        >
                          {u.email || (u.githubId ? "GitHub Auth" : "N/A")}
                        </td>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <span
                            style={{
                              padding: "0.2rem 0.6rem",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              background:
                                u.role === "admin"
                                  ? "rgba(var(--acid-rgb, 232, 255, 0), 0.1)"
                                  : "rgba(255, 255, 255, 0.05)",
                              color:
                                u.role === "admin" ? "var(--accent)" : "#fff",
                              border:
                                u.role === "admin"
                                  ? "1px solid rgba(var(--acid-rgb, 232, 255, 0), 0.3)"
                                  : "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            {u.role || "user"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem 1.5rem",
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "rgba(255,255,255,0.5)",
                        }}
                      >
                        No users found in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "rgba(20, 20, 20, 0.95)",
              border: "1px solid rgba(255, 42, 77, 0.3)",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 0 40px rgba(255, 42, 77, 0.2)",
            }}
          >
            <h3
              style={{
                color: "#ff2a4d",
                marginBottom: "1rem",
                fontFamily: "var(--fb)",
                fontSize: "1.3rem",
              }}
            >
              ⚠️ Delete Project
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.8)",
                marginBottom: "0.5rem",
                fontFamily: "var(--fm)",
              }}
            >
              Are you sure you want to delete this project?
            </p>
            <p
              style={{
                color: "var(--accent)",
                marginBottom: "1.5rem",
                fontFamily: "monospace",
                fontSize: "0.9rem",
                wordBreak: "break-all",
              }}
            >
              {deleteConfirm.name}
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                fontFamily: "var(--fm)",
              }}
            >
              This action will delete the project from the system, clean up
              Docker containers, and remove all logs.
            </p>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                style={{
                  padding: "0.7rem 1.5rem",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  borderRadius: "4px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontFamily: "var(--fm)",
                  opacity: deleting ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  !deleting &&
                  (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
                onMouseLeave={(e) =>
                  !deleting &&
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: "0.7rem 1.5rem",
                  background: deleting
                    ? "rgba(255, 42, 77, 0.5)"
                    : "rgba(255, 42, 77, 0.2)",
                  border: "1px solid rgba(255, 42, 77, 0.5)",
                  color: "#ff2a4d",
                  borderRadius: "4px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontFamily: "var(--fm)",
                  fontWeight: "bold",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  !deleting &&
                  (e.currentTarget.style.boxShadow =
                    "0 0 15px rgba(255, 42, 77, 0.5)")
                }
                onMouseLeave={(e) =>
                  !deleting && (e.currentTarget.style.boxShadow = "none")
                }
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
