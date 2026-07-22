import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-center py-16">
          <p className="text-lg font-semibold text-slate-100 mb-2">
            Something broke in this module.
          </p>
          <p className="text-sm text-slate-400 mb-6 font-mono">
            {this.state.error.message}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.assign("/");
            }}
            className="px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            Back to the dojo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
