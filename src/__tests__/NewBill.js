/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// mock le store qu'on va utiliser
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // affiche les données de la page employé
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
  });

  describe("When I am on NewBill Page", () => {
    // l'icône mail doit être en surbrilliance
    test("Then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail"); // récupère l'icône par son testid
      expect(mailIcon).toHaveClass("active-icon"); //check si l'icône est en surbrillance - on vérifie si l'élément a la classe correspondante
    });

    // le formulaire doit être présent à l'écran avec tous ses champs
    test("Then the form should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByRole("button")).toBeTruthy();
    });
    //tests pour l'upload de fichier
    describe("When I upload a file", () => {
      // clear tous les mocks avant et après chaque test, assure que chaque test tourne bien avec le mock correct
      beforeEach(() => {
        jest.clearAllMocks();
      });
      afterEach(() => {
        jest.clearAllMocks();
      });
      // on peut sélectionner un fichier png jpg ou jpeg
      test("Then, I can select a png, jpg or jpeg file", () => {
        //affiche les données de la page
        const html = NewBillUI();
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const changeFile = jest.fn((e) => newBillContainer.handleChangeFile(e)); // créé la fonction à tester
        const file = screen.getByTestId("file"); // récupère l'input file
        expect(file).toBeTruthy(); // vérifie qu'il soit bien présent à l'écran

        const testFile = new File(["sample.jpg"], "sample.jpg", {
          type: "image/jpg",
        }); // créé un fichier de type jpg à tester

        file.addEventListener("change", changeFile); // écoute la fonction au changement de fichier
        userEvent.upload(file, testFile); // upload le fichier test

        expect(changeFile).toHaveBeenCalled(); // on s'attend à ce que la fonction ait été appellée
        expect(file.files[0]).toEqual(testFile); // le fichier uploadé est bien le fichier test
        expect(file.files[0].name).toBe("sample.jpg"); // le nom du fichier correspond au fichier test

        jest.spyOn(window, "alert").mockImplementation(() => {}); // mock l'appel de l'alerte
        expect(window.alert).not.toHaveBeenCalled(); // s'attend à ce que l'alerte n'ai pas été appellée
      });
      // on ne peut pas upload un fichier qui n'est pas une image
      test("Then, I can't select a non-image file, and the page displays an alert", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const changeFile = jest.fn(newBillContainer.handleChangeFile);
        const file = screen.getByTestId("file");
        expect(file).toBeTruthy();

        const testFile = new File(["sample test file"], "sample.txt", {
          type: "text/plain",
        }); // crée un fichier à tester de type texte

        file.addEventListener("change", changeFile);
        userEvent.upload(file, testFile); // upload le fichier test

        expect(changeFile).toHaveBeenCalled();
        expect(file.files[0].name).not.toBe("sample.png"); // s'attend à ce que le nom du fichier ne soit pas sample.png
        expect(file.files[0].type).not.toBe("image/png"); // s'attend à ce que le type de fichier ne soit pas une image png

        jest.spyOn(window, "alert").mockImplementation(() => {}); // mock l'appel de l'alerte
        expect(window.alert).toHaveBeenCalled(); // s'attend à ce que l'alerte ait été appellée
        expect(file.value).toBe(""); // s'attend à ce que l'input file ait été vidé
      });
    });
  });
});

// TEST INTEGRATION GET METHOD
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      expect(
        await waitFor(() => screen.getByText("Mes notes de frais"))
      ).toBeTruthy();
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    // TEST 404 ERROR
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 404/));
      expect(message).toBeTruthy();
    });

    // TEST 500 ERROR
    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 500/));
      expect(message).toBeTruthy();
    });
  });
});
