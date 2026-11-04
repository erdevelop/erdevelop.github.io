# -*- coding: utf-8 -*-
"""webtk: tkinter'in tarayıcıda (Pyodide) çalışan yaklaşımı. Widget ağacı Python'da tutulur, DOM'u tkweb.js çizer.
Kullanım: import webtk; webtk.kur()  -> sys.modules'e tkinter, tkinter.ttk, filedialog, messagebox ... yerleştirir."""
import itertools
import json
import re
import sys
import types

from js import window as _win          # noqa: E402  (Pyodide)
from pyodide.ffi import create_proxy    # noqa: E402

_B = _win.TkWeb
_W = {}                                  # id -> widget
_ids = itertools.count(1)
_item_ids = itertools.count(1)


def _j(x):
    return json.dumps(x, default=str)


class TclError(Exception):
    pass


class _Bekle(Exception):
    """Dosya seçici gibi eşzamansız iş: JS işi bitirince komut yeniden çalıştırılır."""


# ----------------------------------------------------------------------------- değişkenler
class Variable:
    _tur = str

    def __init__(self, master=None, value=None, name=None):
        self._v = self._tur() if value is None else value
        self._izler = []
        self._bagli = []                 # widget id'leri

    def get(self):
        return self._v

    def set(self, v):
        if self._tur is str:
            v = "" if v is None else str(v)
        elif self._tur is int:
            v = int(v)
        elif self._tur is float:
            v = float(v)
        elif self._tur is bool:
            v = bool(v)
        self._v = v
        for w in list(self._bagli):
            wd = _W.get(w)
            if wd is not None:
                wd._var_yansit()
        for f in list(self._izler):
            try:
                f("", "", "write")
            except TypeError:
                f()

    def trace_add(self, mod, f):
        self._izler.append(f)
        return f

    trace = trace_variable = trace_add

    def trace_remove(self, mod, f):
        if f in self._izler:
            self._izler.remove(f)


class StringVar(Variable):
    _tur = str


class IntVar(Variable):
    _tur = int


class DoubleVar(Variable):
    _tur = float


class BooleanVar(Variable):
    _tur = bool

    def get(self):
        return bool(self._v)


# ----------------------------------------------------------------------------- olay
class Event:
    def __init__(self, **kw):
        self.x = self.y = self.x_root = self.y_root = 0
        self.delta = 0
        self.num = 0
        self.keysym = ""
        self.char = ""
        self.state = 0
        self.width = self.height = 0
        self.widget = None
        self.__dict__.update(kw)


def _dispatch(wid, seq, ev_json):
    """JS -> Python: bir bağlama tetiklendi. 'break' dönerse JS olayı durdurur."""
    w = _W.get(int(wid)) if str(wid) != "all" else None
    d = json.loads(ev_json) if ev_json else {}
    ev = Event(**d)
    hedef = _W.get(int(d.get("wid", 0))) if d.get("wid") else w
    ev.widget = hedef or w
    sonuc = ""
    listesi = []
    if str(wid) == "all":
        listesi = list(_ROOT_ALL.get(seq, []))
    else:
        if w is None:
            return ""
        if d.get("tag") is not None:
            listesi = list(w._tag_binds.get((d["tag"], seq), []))
        else:
            listesi = list(w._binds.get(seq, []))
    for f in listesi:
        try:
            r = f(ev)
        except _Bekle:
            _SON_KOMUT["f"] = (lambda f=f, ev=ev: f(ev))
            break
        except Exception:
            import traceback
            traceback.print_exc()
            continue
        if r == "break":
            sonuc = "break"
            break
    _bitir()
    return sonuc


_ROOT_ALL = {}


def _geri_cagri(wid, ad):
    """JS -> Python: widget komutu (Button command, Scale vs.)."""
    w = _W.get(int(wid))
    if w is None:
        return
    try:
        w._komut(ad)
    except _Bekle:
        _SON_KOMUT["f"] = (lambda: w._komut(ad))
    except Exception:
        import traceback
        traceback.print_exc()
    _bitir()


_after_tbl = {}
_after_ids = itertools.count(1)


def _after_cagri(aid):
    f = _after_tbl.pop(int(aid), None)
    if f is not None:
        try:
            f()
        except _Bekle:
            _SON_KOMUT["f"] = f
        except Exception:
            import traceback
            traceback.print_exc()
    _bitir()


def _bitir():
    """Bir geri çağrı bittikten sonra: üretilen dosyaları indirmeye sun."""
    try:
        _B.flush()
    except Exception:
        pass


# ----------------------------------------------------------------------------- Misc
_BOS = object()


class Misc:
    _sinif = "Widget"

    def _kur(self, master, **kw):
        self.master = master
        self.id = next(_ids)
        _W[self.id] = self
        self._opts = {}
        self._children = []
        self._binds = {}
        self._tag_binds = {}
        self._mgr = None
        self._ginfo = {}
        self._cw = {}
        self._rw = {}
        self._destroyed = False
        if master is not None and hasattr(master, "_children"):
            master._children.append(self)
        self._textvar = kw.pop("textvariable", None)
        self._var = kw.pop("variable", None)
        self._cmd = kw.pop("command", None)
        self._opts.update(kw)
        _B.create(self.id, self._sinif, master.id if master is not None else 0, _j(self._js_opts()))
        if self._textvar is not None:
            self._textvar._bagli.append(self.id)
        if self._var is not None:
            self._var._bagli.append(self.id)
        self._yeni_kur()

    def _yeni_kur(self):
        if self._textvar is not None or self._var is not None:
            self._var_yansit()

    def _js_opts(self):
        o = {}
        for k, v in self._opts.items():
            if k in ("command", "yscrollcommand", "xscrollcommand", "image", "menu", "validatecommand", "postcommand"):
                continue
            if isinstance(v, (Variable, Misc)):
                continue
            o[k] = v
        return o

    def _var_yansit(self):
        v = self._textvar if self._textvar is not None else self._var
        if v is not None:
            _B.setvalue(self.id, "" if v._v is None else str(v._v) if not isinstance(v._v, bool) else ("1" if v._v else "0"))

    def _komut(self, ad):
        if ad == "command" and self._cmd:
            self._cmd()
        elif ad == "value" and False:
            pass

    # --- seçenekler
    def configure(self, cnf=None, **kw):
        if isinstance(cnf, dict):
            kw.update(cnf)
        if not kw:
            return {k: (v,) for k, v in self._opts.items()}
        for k, v in list(kw.items()):
            if k == "textvariable":
                self._textvar = v
                if v is not None:
                    v._bagli.append(self.id)
                    self._var_yansit()
                continue
            if k == "variable":
                self._var = v
                if v is not None:
                    v._bagli.append(self.id)
                    self._var_yansit()
                continue
            if k == "command":
                self._cmd = v
                continue
            self._opts[k] = v
        o = {k: v for k, v in kw.items() if k not in ("textvariable", "variable", "command") and not callable(v)
             and not isinstance(v, (Variable, Misc))}
        if kw.get("menu") is not None:
            o["menu"] = kw["menu"].id
        if o:
            _B.config(self.id, _j(o))

    config = configure

    def cget(self, k):
        if k == "textvariable":
            return self._textvar
        if k == "variable":
            return self._var
        if k == "command":
            return self._cmd
        v = self._opts.get(k, "")
        return v

    def __setitem__(self, k, v):
        self.configure(**{k: v})

    def __getitem__(self, k):
        return self.cget(k)

    def keys(self):
        return list(self._opts)

    # --- geometri
    def _gm(self, mgr, kw):
        if mgr == "pack" and "in_" in kw:
            kw.pop("in_")
        self._mgr = mgr
        self._ginfo = kw
        _B.geom(self.id, mgr, _j({k: (v.id if isinstance(v, Misc) else v) for k, v in kw.items()}))

    def pack(self, cnf=None, **kw):
        if cnf:
            kw.update(cnf)
        self._gm("pack", kw)

    pack_configure = pack

    def grid(self, cnf=None, **kw):
        if cnf:
            kw.update(cnf)
        if "in_" in kw:
            kw.pop("in_")
        self._gm("grid", kw)

    grid_configure = grid

    def place(self, cnf=None, **kw):
        if cnf:
            kw.update(cnf)
        self._gm("place", kw)

    place_configure = place

    def pack_forget(self):
        self._mgr = None
        _B.geom(self.id, "forget", "{}")

    grid_forget = place_forget = pack_forget
    grid_remove = pack_forget

    def pack_info(self):
        return dict(self._ginfo)

    grid_info = place_info = pack_info

    def pack_propagate(self, flag=None):
        _B.config(self.id, _j({"_propagate": bool(flag)}))

    grid_propagate = pack_propagate

    def columnconfigure(self, i, **kw):
        _B.gridcfg(self.id, "col", int(i), _j(kw))

    def rowconfigure(self, i, **kw):
        _B.gridcfg(self.id, "row", int(i), _j(kw))

    grid_columnconfigure = columnconfigure
    grid_rowconfigure = rowconfigure

    # --- bağlamalar
    def bind(self, seq=None, func=None, add=None):
        if seq is None:
            return list(self._binds)
        if func is None:
            return ""
        if add not in ("+", True):
            self._binds[seq] = []
        self._binds.setdefault(seq, []).append(func)
        _B.bind(self.id, seq)
        return seq

    def unbind(self, seq, funcid=None):
        self._binds.pop(seq, None)
        _B.unbind(self.id, seq)

    def bind_all(self, seq, func=None, add=None):
        if func is None:
            return
        if add not in ("+", True):
            _ROOT_ALL[seq] = []
        _ROOT_ALL.setdefault(seq, []).append(func)
        _B.bind(0, seq)

    def unbind_all(self, seq):
        _ROOT_ALL.pop(seq, None)

    def bind_class(self, *a, **k):
        return ""

    def event_generate(self, seq, **kw):
        _B.event_generate(self.id, seq)

    # --- zamanlayıcı
    def after(self, ms, func=None, *args):
        aid = next(_after_ids)
        if func is None:
            return aid
        _after_tbl[aid] = (lambda: func(*args))
        _B.after(aid, int(ms))
        return str(aid)

    def after_idle(self, func, *args):
        return self.after(0, func, *args)

    def after_cancel(self, aid):
        try:
            _after_tbl.pop(int(aid), None)
        except (TypeError, ValueError):
            pass

    # --- winfo
    def winfo_width(self):
        return int(_B.size(self.id, "w"))

    def winfo_height(self):
        return int(_B.size(self.id, "h"))

    def winfo_reqwidth(self):
        return int(_B.size(self.id, "rw"))

    def winfo_reqheight(self):
        return int(_B.size(self.id, "rh"))

    def winfo_x(self):
        return int(_B.size(self.id, "x"))

    def winfo_y(self):
        return int(_B.size(self.id, "y"))

    def winfo_rootx(self):
        return int(_B.size(self.id, "rx"))

    def winfo_rooty(self):
        return int(_B.size(self.id, "ry"))

    def winfo_pointerx(self):
        return int(_B.pointer("x"))

    def winfo_pointery(self):
        return int(_B.pointer("y"))

    def winfo_ismapped(self):
        return bool(_B.mapped(self.id))

    def winfo_viewable(self):
        return self.winfo_ismapped()

    def winfo_exists(self):
        return not self._destroyed

    def winfo_children(self):
        return [c for c in self._children if not c._destroyed]

    def winfo_toplevel(self):
        w = self
        while w.master is not None and not isinstance(w, (Tk, Toplevel)):
            w = w.master
        return w

    def winfo_class(self):
        return self._sinif

    def winfo_screenwidth(self):
        return int(_B.screen("w"))

    def winfo_screenheight(self):
        return int(_B.screen("h"))

    def winfo_containing(self, x, y):
        i = _B.containing(x, y)
        return _W.get(int(i)) if i else None

    def winfo_rgb(self, c):
        s = str(_B.rgb(str(c)))
        r, g, b = [int(x) for x in s.split(",")]
        return (r * 257, g * 257, b * 257)

    def winfo_fpixels(self, v):
        return float(v)

    def update(self):
        pass

    def update_idletasks(self):
        pass

    def focus_set(self):
        _B.focus(self.id)

    focus = focus_force = focus_set

    def focus_get(self):
        i = _B.focused()
        return _W.get(int(i)) if i else None

    def grab_set(self):
        pass

    grab_release = grab_set

    def lift(self, *a):
        _B.lift(self.id)

    tkraise = lift

    def lower(self, *a):
        pass

    def option_add(self, *a, **k):
        pass

    def clipboard_clear(self):
        _B.clip("")

    def clipboard_append(self, s):
        _B.clip(str(s))

    def clipboard_get(self):
        return ""

    def tk_focusNext(self):
        return self

    def destroy(self):
        if self._destroyed:
            return
        for c in list(self._children):
            c.destroy()
        self._destroyed = True
        _B.destroy(self.id)
        if self.master is not None and hasattr(self.master, "_children") and self in self.master._children:
            self.master._children.remove(self)
        _W.pop(self.id, None)

    def nametowidget(self, n):
        return self

    def register(self, f):
        return f

    def mainloop(self, n=0):
        pass

    def quit(self):
        pass

    def wait_window(self, w=None):
        pass

    def wait_visibility(self, w=None):
        pass

    def tk_popup(self, x, y, e=0):
        pass


    def __getattr__(self, ad):
        if ad in _TK_YONTEM:
            _EKSIK.add(self._sinif + "." + ad)
            return lambda *a, **k: None
        raise AttributeError(ad)


_EKSIK = set()
_TK_YONTEM = {"selection_clear", "selection_range", "selection_present", "icursor", "xview", "yview", "xview_moveto",
              "yview_moveto", "xview_scroll", "yview_scroll", "scan_mark", "scan_dragto", "tab", "tabs", "index", "see",
              "tag_configure", "tag_add", "tag_remove", "tag_bind", "tag_raise", "mark_set", "mark_unset", "edit_reset",
              "edit_modified", "edit_undo", "edit_redo", "grid_bbox", "grid_size", "pack_slaves", "grid_slaves", "slaves",
              "winfo_pathname", "winfo_id", "winfo_manager", "winfo_name", "winfo_parent", "winfo_visual", "wm_attributes",
              "iconbitmap", "state", "instate", "identify", "current", "invoke", "flash", "select", "deselect", "toggle",
              "tk_focusPrev", "event_add", "event_delete", "image_names", "focus_displayof", "grab_current", "grab_status",
              "bbox", "coords", "dtag", "postscript", "scale", "tag_lower", "gettags", "itemcget", "type", "insert",
              "delete", "get", "set", "activate", "curselection", "size", "nearest", "selection_includes", "selection_anchor"}


class BaseWidget(Misc):
    def __init__(self, master=None, cnf=None, **kw):
        if cnf:
            kw.update(cnf)
        self._kur(master, **kw)


class Widget(BaseWidget):
    pass


# ----------------------------------------------------------------------------- pencereler
class Wm:
    def title(self, t=None):
        if t is not None:
            _B.config(self.id, _j({"_title": str(t)}))
        return ""

    def geometry(self, g=None):
        if g:
            _B.config(self.id, _j({"_geometry": str(g)}))
        return "%dx%d+0+0" % (self.winfo_width(), self.winfo_height())

    def state(self, s=None):
        return "normal"

    def attributes(self, *a):
        return None

    def protocol(self, name, func=None):
        if name == "WM_DELETE_WINDOW" and func is not None:
            self._opts["_kapat"] = func
            _B.config(self.id, _j({"_kapatCb": 1}))

    def minsize(self, *a):
        pass

    maxsize = resizable = iconbitmap = iconphoto = transient = overrideredirect = minsize

    def withdraw(self):
        _B.config(self.id, _j({"_gizle": 1}))

    def deiconify(self):
        _B.config(self.id, _j({"_gizle": 0}))

    iconify = deiconify

    def wm_title(self, t=None):
        return self.title(t)


class Tk(Misc, Wm):
    _sinif = "Tk"
    _ana = None

    def __init__(self, *a, **k):
        self._kur(None)
        Tk._ana = self
        _W[0] = self

    def _komut(self, ad):
        pass


class Toplevel(BaseWidget, Wm):
    _sinif = "Toplevel"

    def _komut(self, ad):
        pass


# ----------------------------------------------------------------------------- basit widget'lar
class Frame(BaseWidget):
    _sinif = "Frame"


class Label(BaseWidget):
    _sinif = "Label"


class Button(BaseWidget):
    _sinif = "Button"

    def invoke(self):
        if self._cmd:
            return self._cmd()


class Checkbutton(BaseWidget):
    _sinif = "Checkbutton"

    def invoke(self):
        pass

    def _komut(self, ad):
        if ad == "toggle" and self._var is not None:
            v = self._var
            on = self._opts.get("onvalue", 1)
            off = self._opts.get("offvalue", 0)
            if isinstance(v, BooleanVar):
                v.set(not v.get())
            else:
                v.set(off if str(v.get()) == str(on) else on)
        if self._cmd:
            self._cmd()


class Radiobutton(BaseWidget):
    _sinif = "Radiobutton"

    def _komut(self, ad):
        if self._var is not None:
            self._var.set(self._opts.get("value", ""))
        if self._cmd:
            self._cmd()


class Entry(BaseWidget):
    _sinif = "Entry"

    def get(self):
        if self._textvar is not None:
            return self._textvar.get()
        return str(_B.getvalue(self.id))

    def insert(self, i, s):
        cur = self.get()
        k = len(cur) if i == "end" else int(i)
        self._yaz(cur[:k] + str(s) + cur[k:])

    def delete(self, a, b=None):
        cur = self.get()
        i = 0 if a in ("0", 0) else int(a)
        j = len(cur) if b in ("end", None) else int(b)
        self._yaz(cur[:i] + cur[j:] if b is not None else cur[:i] + cur[i + 1:])

    def _yaz(self, s):
        if self._textvar is not None:
            self._textvar.set(s)
        else:
            _B.setvalue(self.id, s)

    def icursor(self, *a):
        pass

    def select_range(self, *a):
        _B.selectall(self.id)

    selection_range = select_range

    def selection_clear(self):
        pass

    def xview(self, *a):
        return (0.0, 1.0)

    def xview_moveto(self, *a):
        pass


class Spinbox(Entry):
    _sinif = "Spinbox"


class Combobox(Entry):
    _sinif = "Combobox"

    def current(self, i=None):
        vals = list(self._opts.get("values") or [])
        if i is None:
            v = self.get()
            return vals.index(v) if v in vals else -1
        if 0 <= i < len(vals):
            self.set(vals[i])

    def set(self, v):
        self._yaz(str(v))

    def configure(self, cnf=None, **kw):
        if "values" in kw:
            kw["values"] = [str(x) for x in kw["values"]]
        super().configure(cnf, **kw)

    config = configure


class Separator(BaseWidget):
    _sinif = "Separator"


class LabelFrame(BaseWidget):
    _sinif = "LabelFrame"


class Scrollbar(BaseWidget):
    _sinif = "Scrollbar"

    def set(self, a, b):
        pass


class Scale(BaseWidget):
    _sinif = "Scale"


class Progressbar(BaseWidget):
    _sinif = "Progressbar"


class Sizegrip(BaseWidget):
    _sinif = "Frame"


class Message(Label):
    pass


class PanedWindow(BaseWidget):
    _sinif = "PanedWindow"

    def __init__(self, master=None, **kw):
        self._panes = []
        super().__init__(master, **kw)

    def add(self, child, **kw):
        if child not in self._panes:
            self._panes.append(child)
        _B.pane_add(self.id, child.id, _j({k: v for k, v in kw.items()}))

    def panes(self):
        return tuple(self._panes)

    def forget(self, child):
        if child in self._panes:
            self._panes.remove(child)
        _B.pane_forget(self.id, child.id)

    remove = forget

    def paneconfigure(self, child, **kw):
        _B.pane_cfg(self.id, child.id, _j(kw))

    paneconfig = paneconfigure

    def sash_coord(self, i):
        return (int(_B.sash(self.id, int(i), -1, 0)), 0)

    def sash_place(self, i, x, y=0):
        _B.sash(self.id, int(i), 1, x if self._opts.get("orient", "horizontal") == "horizontal" else y)

    sashpos = sash_place


class Notebook(BaseWidget):
    _sinif = "Notebook"

    def __init__(self, master=None, **kw):
        self._tabs = []
        self._tabopt = {}
        self._cur = None
        super().__init__(master, **kw)

    def add(self, child, **kw):
        if child in self._tabs:
            self._tabs.remove(child)
        self._tabs.append(child)
        self._tabopt[child.id] = dict(kw)
        _B.nb_set(self.id, _j([c.id for c in self._tabs]), _j({str(c.id): self._tabopt[c.id] for c in self._tabs}))
        if self._cur is None:
            self.select(child)

    def insert(self, pos, child, **kw):
        if child in self._tabs:
            self._tabs.remove(child)
        if pos == "end":
            pos = len(self._tabs)
        self._tabs.insert(int(pos), child)
        self._tabopt[child.id] = dict(kw)
        _B.nb_set(self.id, _j([c.id for c in self._tabs]), _j({str(c.id): self._tabopt[c.id] for c in self._tabs}))
        if self._cur is None:
            self.select(child)

    def forget(self, child):
        child = self._res(child)
        if child in self._tabs:
            self._tabs.remove(child)
        _B.nb_set(self.id, _j([c.id for c in self._tabs]), _j({str(c.id): self._tabopt.get(c.id, {}) for c in self._tabs}))

    hide = forget

    def _res(self, t):
        if isinstance(t, Misc):
            return t
        if isinstance(t, int):
            return self._tabs[t]
        s = str(t)
        for c in self._tabs:
            if s == self._nm(c):
                return c
        return None

    @staticmethod
    def _nm(c):
        return ".t%d" % c.id

    def tabs(self):
        return tuple(self._nm(c) for c in self._tabs)

    def select(self, t=None):
        if t is None:
            return self._nm(self._cur) if self._cur is not None else ""
        c = self._res(t)
        if c is None:
            raise TclError("tab yok")
        self._cur = c
        _B.nb_select(self.id, c.id)
        self._yansit_olay()

    def _yansit_olay(self):
        for f in list(self._binds.get("<<NotebookTabChanged>>", [])):
            try:
                f(Event(widget=self))
            except Exception:
                import traceback
                traceback.print_exc()

    def _js_secildi(self, cid):
        c = _W.get(int(cid))
        if c is not None and c is not self._cur:
            self._cur = c
            self._yansit_olay()

    def tab(self, t, option=None, **kw):
        c = self._res(t)
        if c is None:
            raise TclError("tab yok")
        o = self._tabopt.setdefault(c.id, {})
        if kw:
            o.update(kw)
            _B.nb_set(self.id, _j([x.id for x in self._tabs]), _j({str(x.id): self._tabopt[x.id] for x in self._tabs}))
            return
        if option:
            return o.get(option, "")
        return dict(o)

    def index(self, t):
        if t == "end":
            return len(self._tabs)
        c = self._res(t)
        return self._tabs.index(c) if c in self._tabs else 0

    def enable_traversal(self):
        pass


class Treeview(BaseWidget):
    _sinif = "Treeview"

    def __init__(self, master=None, **kw):
        self._items = {}          # iid -> dict(parent, text, values, tags, open)
        self._order = {"": []}
        self._sel = []
        self._cols = list(kw.get("columns") or [])
        self._heads = {}
        self._colcfg = {}
        self._tagcfg = {}
        self._foc = None
        self._n = itertools.count(1)
        super().__init__(master, **kw)
        _B.tree_cols(self.id, _j(self._cols), _j(kw.get("displaycolumns") or []), kw.get("show", "tree headings"))

    def _yenile(self):
        _B.tree_data(self.id, _j({"items": self._items, "order": self._order, "sel": self._sel}))

    def heading(self, col, option=None, **kw):
        if option:
            return self._heads.get(col, {}).get(option, "")
        d = self._heads.setdefault(col, {})
        for k, v in kw.items():
            d[k] = v if not callable(v) else "cmd"
            if k == "command":
                self._heads[col]["_cb"] = v
        _B.tree_head(self.id, col, _j({k: v for k, v in d.items() if k != "_cb" and k != "command"}))

    def column(self, col, option=None, **kw):
        d = self._colcfg.setdefault(col, {})
        if option:
            return d.get(option, 0)
        d.update(kw)
        _B.tree_col(self.id, col, _j(d))

    def tag_configure(self, tag, **kw):
        self._tagcfg.setdefault(tag, {}).update(kw)
        _B.tree_tag(self.id, tag, _j(self._tagcfg[tag]))

    def insert(self, parent, index, iid=None, **kw):
        if iid is None:
            iid = "I%03d" % next(self._n)
        iid = str(iid)
        vals = [("" if v is None else v) for v in (kw.get("values") or ())]
        tags = kw.get("tags") or ()
        if isinstance(tags, str):
            tags = (tags,)
        self._items[iid] = {"parent": parent, "text": kw.get("text", ""), "values": vals, "tags": list(tags),
                            "open": bool(kw.get("open", False))}
        lst = self._order.setdefault(parent, [])
        if index == "end" or index is None:
            lst.append(iid)
        else:
            lst.insert(int(index), iid)
        self._order.setdefault(iid, [])
        self._dirty()
        return iid

    def _dirty(self):
        if not getattr(self, "_kirli", False):
            self._kirli = True
            _B.later(self.id)

    def _flush(self):
        self._kirli = False
        self._yenile()

    def delete(self, *iids):
        for iid in iids:
            self._sil(str(iid))
        self._dirty()

    def _sil(self, iid):
        it = self._items.pop(iid, None)
        if it is None:
            return
        for c in list(self._order.get(iid, [])):
            self._sil(c)
        self._order.pop(iid, None)
        lst = self._order.get(it["parent"], [])
        if iid in lst:
            lst.remove(iid)
        if iid in self._sel:
            self._sel.remove(iid)

    def get_children(self, item=""):
        if isinstance(item, (tuple, list)):
            item = item[0] if item else ""
        return tuple(self._order.get(item, []))

    def item(self, iid, option=None, **kw):
        it = self._items.get(str(iid))
        if it is None:
            raise TclError("item yok")
        if kw:
            if "values" in kw:
                kw["values"] = [("" if v is None else v) for v in kw["values"]]
            if "tags" in kw and isinstance(kw["tags"], str):
                kw["tags"] = [kw["tags"]]
            it.update(kw)
            self._dirty()
            return
        if option:
            v = it.get(option, "")
            return tuple(v) if option in ("values", "tags") else v
        d = dict(it)
        d["values"] = tuple(d["values"])
        d["tags"] = tuple(d["tags"])
        return d

    def set(self, iid, col=None, value=None):
        it = self._items[str(iid)]
        k = self._cols.index(col) if isinstance(col, str) else int(col)
        while len(it["values"]) <= k:
            it["values"].append("")
        it["values"][k] = value
        self._dirty()

    def parent(self, iid):
        return self._items[str(iid)]["parent"]

    def exists(self, iid):
        return str(iid) in self._items

    def selection(self):
        return tuple(self._sel)

    def selection_set(self, *iids):
        if len(iids) == 1 and isinstance(iids[0], (tuple, list)):
            iids = iids[0]
        self._sel = [str(i) for i in iids]
        self._dirty()
        self._olay()

    selection_add = selection_set

    def selection_remove(self, *iids):
        self._sel = [i for i in self._sel if i not in [str(x) for x in iids]]
        self._dirty()

    def focus(self, iid=None):
        if iid is not None:
            self._foc = str(iid)
        return self._foc or (self._sel[0] if self._sel else "")

    def see(self, iid):
        _B.tree_see(self.id, str(iid))

    def _olay(self):
        for f in list(self._binds.get("<<TreeviewSelect>>", [])):
            f(Event(widget=self))

    def _js_sel(self, sel_json):
        self._sel = list(json.loads(sel_json))
        self._olay()

    def _js_head(self, col):
        cb = self._heads.get(col, {}).get("_cb")
        if cb:
            cb()

    def identify_row(self, y):
        return str(_B.tree_hit(self.id, 0, y, "row"))

    def identify_column(self, x):
        return str(_B.tree_hit(self.id, x, 0, "col"))

    def identify_region(self, x, y):
        return "cell"

    def identify(self, what, x, y):
        return self.identify_row(y)

    def yview(self, *a):
        return (0.0, 1.0)

    def yview_scroll(self, n, what):
        _B.scroll(self.id, int(n) * 20)

    def move(self, iid, parent, index):
        it = self._items[str(iid)]
        self._order[it["parent"]].remove(str(iid))
        it["parent"] = parent
        self._order.setdefault(parent, []).insert(int(index) if index != "end" else len(self._order.get(parent, [])), str(iid))
        self._dirty()

    def bbox(self, *a):
        return (0, 0, 10, 10)


class Listbox(BaseWidget):
    _sinif = "Listbox"

    def __init__(self, master=None, **kw):
        self._li = []
        self._sel = []
        super().__init__(master, **kw)

    def _y(self):
        _B.list_data(self.id, _j(self._li), _j(self._sel))

    def insert(self, i, *vals):
        k = len(self._li) if i == "end" else int(i)
        self._li[k:k] = [str(v) for v in vals]
        self._y()

    def delete(self, a, b=None):
        i = 0 if a in (0, "0") else (len(self._li) if a == "end" else int(a))
        j = len(self._li) if b == "end" else (i if b is None else int(b))
        del self._li[i:j + 1]
        self._y()

    def get(self, a, b=None):
        if b is None:
            return self._li[int(a)]
        j = len(self._li) - 1 if b == "end" else int(b)
        return tuple(self._li[int(a):j + 1])

    def size(self):
        return len(self._li)

    def curselection(self):
        return tuple(self._sel)

    def selection_set(self, a, b=None):
        self._sel = [int(a)] if b is None else list(range(int(a), int(b) + 1))
        self._y()

    def selection_clear(self, *a):
        self._sel = []
        self._y()

    def see(self, i):
        pass

    def yview(self, *a):
        return (0.0, 1.0)

    def xview(self, *a):
        return (0.0, 1.0)

    def activate(self, i):
        pass

    def _js_sel(self, s):
        self._sel = list(json.loads(s))
        for f in list(self._binds.get("<<ListboxSelect>>", [])):
            f(Event(widget=self))


class Text(BaseWidget):
    _sinif = "Text"

    def __init__(self, master=None, **kw):
        self._buf = ""
        self._tags = {}
        super().__init__(master, **kw)

    def _y(self):
        _B.text_set(self.id, self._buf)

    def _ix(self, i):
        if i in ("end", "end-1c", END):
            return len(self._buf) if i != "end" else len(self._buf)
        if i in ("1.0", "0.0"):
            return 0
        m = re.match(r"(\d+)\.(\d+)", str(i))
        if m:
            ln, ch = int(m.group(1)), int(m.group(2))
            lines = self._buf.split("\n")
            return sum(len(x) + 1 for x in lines[:ln - 1]) + ch
        return len(self._buf)

    def insert(self, i, s, *tags):
        k = self._ix(i)
        self._buf = self._buf[:k] + str(s) + self._buf[k:]
        self._y()

    def delete(self, a, b=None):
        i = self._ix(a)
        j = self._ix(b) if b is not None else i + 1
        self._buf = self._buf[:i] + self._buf[j:]
        self._y()

    def get(self, a="1.0", b="end"):
        i, j = self._ix(a), self._ix(b)
        return self._buf[i:j] + ("\n" if (b == "end" and not self._buf.endswith("\n") and False) else "")

    def see(self, i):
        _B.text_end(self.id)

    def tag_configure(self, *a, **k):
        pass

    def tag_add(self, *a, **k):
        pass

    def tag_remove(self, *a, **k):
        pass

    def tag_bind(self, *a, **k):
        pass

    def mark_set(self, *a):
        pass

    def edit_modified(self, *a):
        return False

    def edit_reset(self):
        pass

    def yview(self, *a):
        return (0.0, 1.0)

    def yview_moveto(self, *a):
        pass

    def xview(self, *a):
        return (0.0, 1.0)

    def count(self, *a, **k):
        return (1,)

    def index(self, i):
        return "1.0"

    def focus_set(self):
        _B.focus(self.id)

    def _js_text(self, s):
        self._buf = s


class Menu(BaseWidget):
    _sinif = "Menu"

    def __init__(self, master=None, **kw):
        self._e = []
        super().__init__(master, **kw)

    def _y(self):
        _B.menu_set(self.id, _j([{k: (v.id if isinstance(v, Misc) else v) for k, v in e.items()
                                  if not callable(v) and not isinstance(v, Variable)} for e in self._e]))

    def _add(self, tur, kw):
        e = dict(kw)
        e["tur"] = tur
        e["_i"] = len(self._e)
        self._e.append(e)
        self._y()

    def add_command(self, **kw):
        self._add("command", kw)

    def add_cascade(self, **kw):
        self._add("cascade", kw)

    def add_separator(self, **kw):
        self._add("separator", kw)

    def add_checkbutton(self, **kw):
        self._add("check", kw)

    def add_radiobutton(self, **kw):
        self._add("radio", kw)

    def delete(self, a, b=None):
        if a in (0, "0") and b in ("end", None):
            self._e = []
        elif b == "end":
            del self._e[int(a):]
        self._y()

    def entryconfigure(self, i, **kw):
        if isinstance(i, int) and 0 <= i < len(self._e):
            self._e[i].update(kw)
            self._y()

    entryconfig = entryconfigure

    def index(self, i):
        return len(self._e) - 1 if i == "end" else i

    def _item(self, i):
        e = self._e[int(i)]
        if e["tur"] == "check":
            v = e.get("variable")
            if v is not None:
                if isinstance(v, BooleanVar):
                    v.set(not v.get())
                else:
                    v.set(0 if v.get() else 1)
        elif e["tur"] == "radio":
            v = e.get("variable")
            if v is not None:
                v.set(e.get("value"))
        cmd = e.get("command")
        if cmd:
            cmd()

    def tk_popup(self, x, y, e=0):
        for f in ("postcommand",):
            if self._opts.get(f):
                self._opts[f]()
        _B.menu_popup(self.id, x, y)

    post = tk_popup

    def unpost(self):
        pass

    def invoke(self, i):
        self._item(i)


# ----------------------------------------------------------------------------- Canvas
class Canvas(BaseWidget):
    _sinif = "Canvas"

    def __init__(self, master=None, **kw):
        self._it = {}               # id -> dict(type, c, o, tags)
        self._sira = []
        self._tagb = {}
        self._wins = {}
        super().__init__(master, **kw)

    # -- kimlikler
    def _ids(self, spec):
        if isinstance(spec, int):
            return [spec] if spec in self._it else []
        if spec == "all":
            return list(self._sira)
        if spec == "current":
            return []
        s = str(spec)
        if s.isdigit() and int(s) in self._it:
            return [int(s)]
        return [i for i in self._sira if s in self._it[i]["tags"]]

    def _yeni(self, tur, args, kw):
        c = []
        for a in args:
            if isinstance(a, (list, tuple)):
                c.extend(float(x) for x in a)
            elif isinstance(a, (int, float)):
                c.append(float(a))
        iid = next(_item_ids)
        tags = kw.pop("tags", ())
        if isinstance(tags, str):
            tags = (tags,)
        win = kw.get("window")
        if win is not None:
            kw["window"] = win.id
            self._wins[iid] = win
        self._it[iid] = {"type": tur, "c": c, "o": dict(kw), "tags": list(tags)}
        self._sira.append(iid)
        _B.cv_create(self.id, iid, tur, _j(c), _j(kw), _j(list(tags)))
        return iid

    def create_line(self, *a, **kw):
        return self._yeni("line", a, kw)

    def create_rectangle(self, *a, **kw):
        return self._yeni("rectangle", a, kw)

    def create_oval(self, *a, **kw):
        return self._yeni("oval", a, kw)

    def create_polygon(self, *a, **kw):
        return self._yeni("polygon", a, kw)

    def create_text(self, *a, **kw):
        return self._yeni("text", a, kw)

    def create_arc(self, *a, **kw):
        return self._yeni("arc", a, kw)

    def create_image(self, *a, **kw):
        kw.pop("image", None)
        return self._yeni("image", a, kw)

    def create_window(self, *a, **kw):
        return self._yeni("window", a, kw)

    # -- değişiklikler
    def delete(self, *specs):
        gone = []
        for s in specs:
            for i in self._ids(s):
                if i in self._it:
                    gone.append(i)
                    del self._it[i]
                    self._sira.remove(i)
                    self._wins.pop(i, None)
        if gone:
            _B.cv_delete(self.id, _j(gone))

    def coords(self, spec, *args):
        ids = self._ids(spec)
        if not ids:
            return []
        if not args:
            return list(self._it[ids[0]]["c"])
        c = []
        for a in args:
            if isinstance(a, (list, tuple)):
                c.extend(float(x) for x in a)
            else:
                c.append(float(a))
        for i in ids:
            self._it[i]["c"] = list(c)
            _B.cv_coords(self.id, i, _j(c))

    def itemconfigure(self, spec, **kw):
        ids = self._ids(spec)
        if not kw:
            return {k: (k, "", "", "", v) for k, v in (self._it[ids[0]]["o"].items() if ids else [])}
        if "tags" in kw:
            t = kw.pop("tags")
            for i in ids:
                self._it[i]["tags"] = [t] if isinstance(t, str) else list(t)
        if "window" in kw and kw["window"] is not None and not isinstance(kw["window"], int):
            kw["window"] = kw["window"].id
        for i in ids:
            self._it[i]["o"].update(kw)
        if ids:
            _B.cv_cfg(self.id, _j(ids), _j(kw))

    itemconfig = itemconfigure

    def itemcget(self, spec, k):
        ids = self._ids(spec)
        return self._it[ids[0]]["o"].get(k, "") if ids else ""

    def move(self, spec, dx, dy):
        ids = self._ids(spec)
        for i in ids:
            c = self._it[i]["c"]
            self._it[i]["c"] = [v + (dx if k % 2 == 0 else dy) for k, v in enumerate(c)]
        if ids:
            _B.cv_move(self.id, _j(ids), dx, dy)

    def scale(self, spec, ox, oy, sx, sy):
        for i in self._ids(spec):
            c = self._it[i]["c"]
            self._it[i]["c"] = [(ox + (v - ox) * sx) if k % 2 == 0 else (oy + (v - oy) * sy) for k, v in enumerate(c)]
            _B.cv_coords(self.id, i, _j(self._it[i]["c"]))

    def addtag_withtag(self, tag, spec):
        for i in self._ids(spec):
            if tag not in self._it[i]["tags"]:
                self._it[i]["tags"].append(tag)
                _B.cv_tags(self.id, i, _j(self._it[i]["tags"]))

    def dtag(self, spec, tag=None):
        for i in self._ids(spec):
            t = tag or spec
            if t in self._it[i]["tags"]:
                self._it[i]["tags"].remove(t)
                _B.cv_tags(self.id, i, _j(self._it[i]["tags"]))

    def gettags(self, spec):
        ids = self._ids(spec)
        return tuple(self._it[ids[0]]["tags"]) if ids else ()

    def tag_raise(self, spec, above=None):
        ids = self._ids(spec)
        for i in ids:
            self._sira.remove(i)
            self._sira.append(i)
        if ids:
            _B.cv_order(self.id, _j(ids), 1)

    def tag_lower(self, spec, below=None):
        ids = self._ids(spec)
        for i in reversed(ids):
            self._sira.remove(i)
            self._sira.insert(0, i)
        if ids:
            _B.cv_order(self.id, _j(ids), 0)

    lift = tag_raise

    def find_withtag(self, spec):
        return tuple(self._ids(spec))

    def find_all(self):
        return tuple(self._sira)

    def type(self, spec):
        ids = self._ids(spec)
        return self._it[ids[0]]["type"] if ids else None

    def find_closest(self, x, y, halo=None, start=None):
        r = _B.cv_closest(self.id, x, y)
        return (int(r),) if r else ()

    def find_overlapping(self, x0, y0, x1, y1):
        return tuple(int(i) for i in json.loads(str(_B.cv_overlap(self.id, x0, y0, x1, y1))))

    find_enclosed = find_overlapping

    def bbox(self, *specs):
        ids = []
        for s in specs:
            ids += self._ids(s)
        if not ids:
            return None
        r = json.loads(str(_B.cv_bbox(self.id, _j(ids))))
        return tuple(r) if r else None

    def tag_bind(self, tag, seq, func=None, add=None):
        if func is None:
            return
        k = (tag, seq)
        if add not in ("+", True):
            self._tag_binds[k] = []
        self._tag_binds.setdefault(k, []).append(func)
        _B.cv_tagbind(self.id, str(tag), seq)

    def tag_unbind(self, tag, seq, *a):
        self._tag_binds.pop((tag, seq), None)

    def canvasx(self, x, gridspacing=None):
        return float(_B.cv_scroll(self.id, "x")) + x

    def canvasy(self, y, gridspacing=None):
        return float(_B.cv_scroll(self.id, "y")) + y

    def xview_moveto(self, f):
        _B.cv_view(self.id, "x", "moveto", float(f))

    def yview_moveto(self, f):
        _B.cv_view(self.id, "y", "moveto", float(f))

    def xview_scroll(self, n, what="units"):
        _B.cv_view(self.id, "x", "scroll", float(n) * (20 if what == "units" else 200))

    def yview_scroll(self, n, what="units"):
        _B.cv_view(self.id, "y", "scroll", float(n) * (20 if what == "units" else 200))

    def xview(self, *a):
        return (0.0, 1.0)

    def yview(self, *a):
        return (0.0, 1.0)

    def scan_mark(self, x, y):
        pass

    def scan_dragto(self, x, y, gain=10):
        pass

    def postscript(self, **kw):
        return ""

    def configure(self, cnf=None, **kw):
        if "scrollregion" in kw and isinstance(kw["scrollregion"], (list, tuple)):
            kw["scrollregion"] = list(kw["scrollregion"])
        super().configure(cnf, **kw)

    config = configure


# ----------------------------------------------------------------------------- Style
class Style:
    def __init__(self, master=None):
        pass

    def configure(self, name, **kw):
        _B.style_cfg(name, _j({k: (v if not isinstance(v, (list, tuple)) or not v else list(v)) for k, v in kw.items()}))

    def map(self, name, **kw):
        _B.style_map(name, _j({k: [list(x) for x in v] for k, v in kw.items()}))

    def theme_use(self, n=None):
        return "clam"

    def layout(self, *a, **k):
        if a and len(a) > 1 and a[1] == []:
            _B.style_cfg(a[0], _j({"_gizle": 1}))

    def lookup(self, name, opt, state=None, default=None):
        return str(_B.style_lookup(name, opt))

    def element_create(self, *a, **k):
        pass


# ----------------------------------------------------------------------------- iletişim kutuları
class _Msg:
    @staticmethod
    def _g(baslik, mesaj):
        return "%s\n\n%s" % (baslik, mesaj) if baslik else str(mesaj)

    def showinfo(self, title=None, message=None, **k):
        _B.alert(self._g(title, message))
        return "ok"

    showwarning = showerror = showinfo

    def askyesno(self, title=None, message=None, **k):
        return bool(_B.confirm(self._g(title, message)))

    askokcancel = askretrycancel = askyesno

    def askyesnocancel(self, title=None, message=None, **k):
        r = _B.confirm(self._g(title, message) + "\n\n(Tamam = Evet, İptal = Hayır)")
        return True if r else False


_dosya_cevap = {}


def _dosya_istegi(tur, **kw):
    """Açma/kaydetme iletişim kutuları: JS dosya seçicisi eşzamansız olduğundan komut yeniden oynatılır."""
    anahtar = tur
    if tur == "save":
        ad = kw.get("initialfile") or "cikti" + (kw.get("defaultextension") or "")
        yol = "/tmp/indir/" + ad
        import os
        os.makedirs("/tmp/indir", exist_ok=True)
        _B.queue_download(yol, ad)
        return yol
    if anahtar in _dosya_cevap:
        return _dosya_cevap.pop(anahtar)
    _B.pick_file(tur, _j({"filetypes": kw.get("filetypes") or [], "title": kw.get("title") or ""}))
    raise _Bekle()


class _FileDialog:
    def askopenfilename(self, **kw):
        return _dosya_istegi("open", **kw)

    def asksaveasfilename(self, **kw):
        return _dosya_istegi("save", **kw)

    def askdirectory(self, **kw):
        return ""

    def askopenfilenames(self, **kw):
        r = _dosya_istegi("open", **kw)
        return (r,) if r else ()


class _Simple:
    def askstring(self, title=None, prompt=None, initialvalue=None, **k):
        r = _B.prompt(prompt or title or "", "" if initialvalue is None else str(initialvalue))
        return None if r is None else str(r)

    def askinteger(self, title=None, prompt=None, initialvalue=None, minvalue=None, maxvalue=None, **k):
        r = _B.prompt(prompt or title or "", "" if initialvalue is None else str(initialvalue))
        if r is None:
            return None
        try:
            v = int(str(r).strip())
        except ValueError:
            return None
        if minvalue is not None and v < minvalue:
            return None
        if maxvalue is not None and v > maxvalue:
            return None
        return v

    def askfloat(self, *a, **k):
        r = self.askstring(*a[:3], **{x: y for x, y in k.items() if x == "initialvalue"})
        try:
            return float(str(r).replace(",", "."))
        except (TypeError, ValueError):
            return None


class _Color:
    def askcolor(self, color=None, **k):
        r = _B.color(color or "#888888")
        return (None, str(r)) if r else (None, None)


class _Font:
    class Font:
        def __init__(self, root=None, font=None, **kw):
            self.f = font if font is not None else (kw.get("family", "Segoe UI"), kw.get("size", 9), kw.get("weight", "normal"))

        def measure(self, text):
            return int(_B.measure(_j(self.f), str(text)))

        def metrics(self, k=None):
            d = {"linespace": 16, "ascent": 12, "descent": 4}
            return d[k] if k else d

        def actual(self, *a):
            return {}

        def cget(self, k):
            return ""

        def configure(self, **k):
            pass

    def nametofont(self, n):
        return self.Font()

    def families(self, *a):
        return ["Segoe UI", "Consolas"]


# ----------------------------------------------------------------------------- modüllerin kurulumu
END = "end"
INSERT = "insert"
SEL = "sel"
LEFT, RIGHT, TOP, BOTTOM = "left", "right", "top", "bottom"
X, Y, BOTH, NONE = "x", "y", "both", "none"
N, S, E, W, NW, NE, SW, SE, CENTER = "n", "s", "e", "w", "nw", "ne", "sw", "se", "center"
NS, EW, NSEW = "ns", "ew", "nsew"
HORIZONTAL, VERTICAL = "horizontal", "vertical"
NORMAL, DISABLED, ACTIVE, HIDDEN = "normal", "disabled", "active", "hidden"
WORD, CHAR = "word", "char"
SUNKEN, RAISED, FLAT, GROOVE, RIDGE, SOLID = "sunken", "raised", "flat", "groove", "ridge", "solid"
YES, NO, TRUE, FALSE = 1, 0, True, False
ALL = "all"


def kur():
    tk = types.ModuleType("tkinter")
    ttk = types.ModuleType("tkinter.ttk")
    for n in ("Tk", "Toplevel", "Frame", "Label", "Button", "Checkbutton", "Radiobutton", "Entry", "Spinbox", "Text", "Canvas",
              "Listbox", "Menu", "PanedWindow", "Scale", "Scrollbar", "Message", "LabelFrame", "Misc", "Widget",
              "StringVar", "IntVar", "DoubleVar", "BooleanVar", "Variable", "Event", "TclError"):
        setattr(tk, n, globals()[n])
    for k, v in list(globals().items()):
        if k.isupper() and k in ("END", "INSERT", "SEL", "LEFT", "RIGHT", "TOP", "BOTTOM", "X", "Y", "BOTH", "NONE", "N", "S", "E",
                                  "W", "NW", "NE", "SW", "SE", "CENTER", "NS", "EW", "NSEW", "HORIZONTAL", "VERTICAL", "NORMAL",
                                  "DISABLED", "ACTIVE", "HIDDEN", "WORD", "CHAR", "SUNKEN", "RAISED", "FLAT", "GROOVE", "RIDGE",
                                  "SOLID", "YES", "NO", "TRUE", "FALSE", "ALL"):
            setattr(tk, k, v)
    for n in ("Frame", "Label", "Button", "Checkbutton", "Radiobutton", "Entry", "Combobox", "Spinbox", "Notebook", "Treeview",
              "Scrollbar", "Scale", "Progressbar", "Separator", "Sizegrip", "Style", "LabelFrame", "PanedWindow"):
        setattr(ttk, n, globals()[n])
    ttk.Labelframe = LabelFrame
    ttk.Panedwindow = PanedWindow
    tk.ttk = ttk
    tk.filedialog = fd = _FileDialog()
    tk.messagebox = _Msg()
    tk.simpledialog = _Simple()
    tk.colorchooser = _Color()
    tk.font = _Font()
    mods = {"tkinter": tk, "tkinter.ttk": ttk, "tkinter.filedialog": fd, "tkinter.messagebox": tk.messagebox,
            "tkinter.simpledialog": tk.simpledialog, "tkinter.colorchooser": tk.colorchooser, "tkinter.font": tk.font}
    sys.modules.update(mods)
    # JS köprüsü
    _B.pyEvent = create_proxy(_dispatch)
    _B.pyCmd = create_proxy(_geri_cagri)
    _B.pyAfter = create_proxy(_after_cagri)
    _B.pyFlushTree = create_proxy(lambda i: _W[int(i)]._flush() if int(i) in _W and hasattr(_W[int(i)], "_flush") else None)
    _B.pyNb = create_proxy(lambda nb, c: _W[int(nb)]._js_secildi(c))
    _B.pyTreeSel = create_proxy(lambda i, s: _W[int(i)]._js_sel(s))
    _B.pyTreeHead = create_proxy(lambda i, c: _W[int(i)]._js_head(c))
    _B.pyListSel = create_proxy(lambda i, s: _W[int(i)]._js_sel(s))
    _B.pyText = create_proxy(lambda i, s: _W[int(i)]._js_text(s))
    _B.pyMenu = create_proxy(lambda i, k: _W[int(i)]._item(k))
    _B.pyVar = create_proxy(lambda i, s: _var_js(int(i), s))
    _B.pyFile = create_proxy(_dosya_geldi)
    return tk


def _var_js(wid, s):
    w = _W.get(wid)
    if w is None:
        return
    v = w._textvar if w._textvar is not None else w._var
    if v is None:
        return
    if isinstance(v, BooleanVar):
        v.set(s in ("1", "true", "True", 1, True))
    elif isinstance(v, (IntVar, DoubleVar)):
        try:
            v.set(float(s) if isinstance(v, DoubleVar) else int(float(s)))
        except ValueError:
            pass
    else:
        v._v = s
        for f in list(v._izler):
            try:
                f("", "", "write")
            except TypeError:
                f()
        for k in list(v._bagli):
            if k != wid:
                x = _W.get(k)
                if x is not None:
                    x._var_yansit()
    _bitir()


def _dosya_geldi(tur, yol):
    """JS: kullanıcı dosyayı seçti ve sanal dosya sistemine yazıldı -> bekleyen komutu yeniden çalıştır."""
    _dosya_cevap[tur] = yol
    f = _SON_KOMUT.get("f")
    if f:
        _calistir(f)


_SON_KOMUT = {}


def _calistir(f):
    _SON_KOMUT["f"] = f
    try:
        f()
    except _Bekle:
        pass
    _bitir()
